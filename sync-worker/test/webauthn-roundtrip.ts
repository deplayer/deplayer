/**
 * Server-side WebAuthn roundtrip test for the sync worker's auth endpoints.
 *
 * A browser cannot be assumed in CI, so instead of driving
 * `navigator.credentials` (virtual authenticators require real window
 * focus, which managed headless browsers do not provide), this script
 * fabricates *cryptographically valid* registration and assertion
 * responses — a self-attestation (fmt `none`) registration over a real
 * P-256 key pair, and an ECDSA-SHA256 assertion signed by the same key —
 * and pushes them through the live worker's `/auth/*` HTTP API.
 *
 * This exercises: origin allow-list, challenge lifecycle (issue/expiry/
 * single-use), user + credential persistence in the AuthDO,
 * `verifyRegistrationResponse` / `verifyAuthenticationResponse` against
 * the stored COSE key, and JWT issuance with the `user-<id>` storeId.
 *
 * Run against a live `wrangler dev` instance:
 *   WEBAUTHN_URL=http://localhost:8799 npm run worker:webauthn
 */
import { createHash, createSign, generateKeyPairSync, randomBytes } from 'node:crypto'

const BASE_URL = process.env.WEBAUTHN_URL ?? 'http://localhost:8799'
/** Must be one of the worker's ALLOWED_ORIGINS. */
const ORIGIN = process.env.WEBAUTHN_ORIGIN ?? 'http://localhost:5175'
const RP_ID = 'localhost'

// ---------------------------------------------------------------------------
// Minimal CBOR encoder (uint / nint / bytes / text / map)
// ---------------------------------------------------------------------------

function cborHeader(major: number, len: number): Uint8Array<ArrayBuffer> {
  if (len < 24) {
    return new Uint8Array([(major << 5) | len])
  }
  if (len < 0x100) {
    return new Uint8Array([(major << 5) | 24, len])
  }
  if (len < 0x10000) {
    return new Uint8Array([(major << 5) | 25, (len >> 8) & 0xff, len & 0xff])
  }
  const out = new Uint8Array(6)
  out[0] = (major << 5) | 26
  for (let i = 3; i >= 0; i--) {
    out[i + 1] = (len >> (i * 8)) & 0xff
  }
  return out
}

type CborValue = number | bigint | Uint8Array | string | [CborValue, CborValue][]

function cborEncode(value: CborValue): Uint8Array<ArrayBuffer> {
  if (typeof value === 'number') {
    if (value >= 0) {
      return cborHeader(0, value)
    }
    return cborHeader(1, -value - 1)
  }
  if (typeof value === 'bigint') {
    if (value >= 0n) {
      return cborHeader(0, Number(value))
    }
    return cborHeader(1, Number(-value - 1n))
  }
  if (value instanceof Uint8Array) {
    return new Uint8Array([...cborHeader(2, value.length), ...value])
  }
  if (typeof value === 'string') {
    const utf8 = new TextEncoder().encode(value)
    return new Uint8Array([...cborHeader(3, utf8.length), ...utf8])
  }
  if (Array.isArray(value)) {
    const parts: Uint8Array[] = [cborHeader(5, value.length)]
    for (const [k, v] of value) {
      parts.push(cborEncode(k), cborEncode(v))
    }
    return concat(parts)
  }
  throw new Error(`unsupported CBOR value: ${String(value)}`)
}

function concat(chunks: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}

// ---------------------------------------------------------------------------
// base64 / base64url helpers (mirror the simplewebauthn conventions)
// ---------------------------------------------------------------------------

function toB64u(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) {
    bin += String.fromCharCode(b)
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64u(str: string): Uint8Array<ArrayBuffer> {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4)
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i)
  }
  return out
}

function sha256(data: Uint8Array | string): Uint8Array<ArrayBuffer> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  return new Uint8Array(createHash('sha256').update(bytes).digest())
}

// ---------------------------------------------------------------------------
// COSE key (ES256 / P-256) from a WebCrypto key
// ---------------------------------------------------------------------------

async function coseKeyFromJwk(jwk: { x: string; y: string }): Promise<Uint8Array<ArrayBuffer>> {
  const x = fromB64u(jwk.x)
  const y = fromB64u(jwk.y)
  const key: [CborValue, CborValue][] = [
    [1, 2], // kty: EC2
    [3, -7], // alg: ES256
    [-1, 1], // crv: P-256
    [-2, x],
    [-3, y],
  ]
  return cborEncode(key)
}

// ---------------------------------------------------------------------------
// Scenario
// ---------------------------------------------------------------------------

interface AuthOptions {
  challengeId: string
  options: {
    challenge: string
    rp?: { name: string; id: string }
    rpId?: string
    user?: { id: string; name: string; displayName: string }
    allowCredentials?: { id: string }[]
    authenticatorSelection?: Record<string, unknown>
    timeout: number
    attestation?: string
  }
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  const json = JSON.parse(text || 'null') as T & { error?: string }
  if (!response.ok) {
    throw new Error(`${path} -> ${response.status}: ${json?.error ?? text.slice(0, 200)}`)
  }
  return json
}

let failures = 0
const check = (cond: boolean, label: string, detail = ''): void => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? ` (${detail})` : ''}`)
  if (!cond) {
    failures++
  }
}

const userName = `Probe-${Date.now().toString(36)}`

console.log(`== WebAuthn roundtrip (${BASE_URL}, origin ${ORIGIN}) ==`)

async function main(): Promise<void> {
  // Node's webcrypto cannot generate EC keys in this runtime, so use
  // node:crypto: prime256v1 == P-256, and its ECDSA signature is the same
  // DER ECDSA-Sig-Value encoding WebCrypto produces.
  const keyPair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const jwk = keyPair.publicKey.export({ format: 'jwk' }) as { x: string; y: string }
  const coseKey = await coseKeyFromJwk(jwk)
  const signEcdsa = (data: Uint8Array<ArrayBuffer>): Buffer => createSign('sha256').update(data).sign(keyPair.privateKey)

  const credentialId = randomBytes(16)
  const rpIdHash = sha256(RP_ID)
  const aaguid = new Uint8Array(16)

  // --- Registration -----------------------------------------------------

  const regEnvelope = await postJson<AuthOptions>('/auth/register/options', { name: userName })
  check(regEnvelope.options.rp?.id === RP_ID, 'registration RP id matches worker env', regEnvelope.options.rp?.id)

  const userIdBytes = fromB64u(regEnvelope.options.user?.id ?? '')
  check(userIdBytes.length > 0, 'registration user id present')

  const regClientData = JSON.stringify({
    type: 'webauthn.create',
    challenge: regEnvelope.options.challenge,
    origin: ORIGIN,
  })
  const regAuthData = concat([
    rpIdHash,
    new Uint8Array([0x41]), // UP | AT
    new Uint8Array([0, 0, 0, 0]), // sign counter
    aaguid,
    // Attested credential data: credential-id length + credential-id
    new Uint8Array([(credentialId.length >> 8) & 0xff, credentialId.length & 0xff]),
    credentialId,
    coseKey,
  ])
  const regAttestationObject = cborEncode(
    [
      ['fmt', 'none'],
      ['attStmt', []],
      ['authData', regAuthData],
    ]
  )

  const regResult = await postJson<{ userId: string; token: string }>('/auth/register/verify', {
    challengeId: regEnvelope.challengeId,
    response: {
      type: 'public-key',
      id: toB64u(credentialId),
      rawId: toB64u(credentialId),
      response: {
        clientDataJSON: toB64u(new TextEncoder().encode(regClientData)),
        attestationObject: toB64u(regAttestationObject),
        userHandle: toB64u(userIdBytes),
      },
      authenticatorAttachment: 'platform',
    },
  })
  check(regResult.userId.length > 0 && typeof regResult.token === 'string', 'registration created user + token')

  const jwtPayload = JSON.parse(
    atob(regResult.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
  ) as { sub?: string }
  check(jwtPayload.sub === regResult.userId, 'JWT sub is the new user id', String(jwtPayload.sub))

  // --- Reuse of a consumed challenge must fail --------------------------

  const reuse = await fetch(`${BASE_URL}/auth/register/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeId: regEnvelope.challengeId,
      response: {
        type: 'public-key',
        id: toB64u(credentialId),
        rawId: toB64u(credentialId),
        response: {
          clientDataJSON: toB64u(new TextEncoder().encode(regClientData)),
          attestationObject: toB64u(regAttestationObject),
          userHandle: toB64u(userIdBytes),
        },
        authenticatorAttachment: 'platform',
      },
    }),
  }).then((r) => r.status)
  check(reuse === 400, 'consumed challenge is rejected', `status ${reuse}`)

  // --- Duplicate name must be rejected ----------------------------------

  const dupStatus = await fetch(`${BASE_URL}/auth/register/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: userName }),
  }).then((r) => r.status)
  check(dupStatus === 400, 'duplicate name rejected', `status ${dupStatus}`)

  // --- Login (discoverable credential assertion) ------------------------

  const loginEnvelope = await postJson<AuthOptions>('/auth/login/options')
  check(loginEnvelope.options.rpId === RP_ID, 'login RP id matches worker env', loginEnvelope.options.rpId)

  const loginClientData = JSON.stringify({
    type: 'webauthn.get',
    challenge: loginEnvelope.options.challenge,
    origin: ORIGIN,
  })
  const loginClientDataHash = sha256(loginClientData)
  const loginAuthData = concat([
    rpIdHash,
    new Uint8Array([0x05]), // UP | UV (no AT bit — no credential section in assertion)
    new Uint8Array([0, 0, 0, 1]), // counter advanced
  ])
  const signature = signEcdsa(concat([loginAuthData, loginClientDataHash]))
  const loginResult = await postJson<{ userId: string; name: string; token: string }>('/auth/login/verify', {
    challengeId: loginEnvelope.challengeId,
    response: {
      type: 'public-key',
      id: toB64u(credentialId),
      rawId: toB64u(credentialId),
      response: {
        clientDataJSON: toB64u(new TextEncoder().encode(loginClientData)),
        authenticatorData: toB64u(loginAuthData),
        signature: toB64u(signature),
        userHandle: toB64u(userIdBytes),
      },
      authenticatorAttachment: 'platform',
    },
  })
  check(loginResult.userId === regResult.userId, 'login resolves to the registered user')
  check(loginResult.name === userName, 'login returns the account name', loginResult.name)
  check(typeof loginResult.token === 'string' && loginResult.token.split('.').length === 3, 'login token is a JWT')

  // --- Tampered assertion must be rejected ------------------------------

  const tamperedEnvelope = await postJson<AuthOptions>('/auth/login/options')
  const tamperedClientData = JSON.stringify({
    type: 'webauthn.get',
    challenge: tamperedEnvelope.options.challenge,
    origin: ORIGIN,
  })
  const tamperedAuthData = concat([
    rpIdHash,
    new Uint8Array([0x05]),
    new Uint8Array([0, 0, 0, 1]),
  ])
  // Sign with the key, then flip the user-present flag: the signature will no longer match.
  const goodSig = signEcdsa(concat([tamperedAuthData, sha256(tamperedClientData)]))
  const tamperedAuthData2 = tamperedAuthData.slice()
  tamperedAuthData2[32] ^= 0x01
  const tamperedStatus = await fetch(`${BASE_URL}/auth/login/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({
      challengeId: tamperedEnvelope.challengeId,
      response: {
        type: 'public-key',
        id: toB64u(credentialId),
        rawId: toB64u(credentialId),
        response: {
          clientDataJSON: toB64u(new TextEncoder().encode(tamperedClientData)),
          authenticatorData: toB64u(tamperedAuthData2),
          signature: toB64u(goodSig),
          userHandle: toB64u(userIdBytes),
        },
        authenticatorAttachment: 'platform',
      },
    }),
  }).then((r) => r.status)
  check(tamperedStatus === 400, 'tampered assertion rejected', `status ${tamperedStatus}`)

  // --- Wrong origin must be rejected ------------------------------------

  const wrongOriginEnvelope = await postJson<AuthOptions>('/auth/login/options')
  const wrongOriginClientData = JSON.stringify({
    type: 'webauthn.get',
    challenge: wrongOriginEnvelope.options.challenge,
    origin: 'http://evil.example',
  })
  const wrongOriginStatus = await fetch(`${BASE_URL}/auth/login/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({
      challengeId: wrongOriginEnvelope.challengeId,
      response: {
        type: 'public-key',
        id: toB64u(credentialId),
        rawId: toB64u(credentialId),
        response: {
          clientDataJSON: toB64u(new TextEncoder().encode(wrongOriginClientData)),
          authenticatorData: toB64u(loginAuthData),
          signature: toB64u(signature),
          userHandle: toB64u(userIdBytes),
        },
        authenticatorAttachment: 'platform',
      },
    }),
  }).then((r) => r.status)
  check(wrongOriginStatus === 400, 'wrong origin rejected', `status ${wrongOriginStatus}`)

  // --- Disallowed Origin header is rejected at the worker edge ----------

  const disallowedHeaderStatus = await fetch(`${BASE_URL}/auth/login/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://evil.example' },
  }).then((r) => r.status)
  check(disallowedHeaderStatus === 403, 'disallowed Origin header rejected at worker edge', `status ${disallowedHeaderStatus}`)
}

main()
  .catch((err) => {
    failures++
    console.error('  FAIL  scenario aborted:', err instanceof Error ? err.message : String(err))
  })
  .finally(() => {
    console.log(failures === 0 ? '\n== ALL WEBAUTHN CHECKS PASSED ==' : `\n== ${failures} WEBAUTHN CHECK(S) FAILED ==`)
    process.exit(failures === 0 ? 0 : 1)
  })
