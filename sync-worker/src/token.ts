import { SignJWT, jwtVerify } from 'jose'

const ISSUER = 'deplayer-sync'
const TOKEN_TTL_SECONDS = 30 * 24 * 3600

/**
 * Mint a HS256 JWT for a user: sub=userId, iss="deplayer-sync",
 * 30-day expiry. `now` is injectable for tests.
 */
export async function issueToken(userId: string, secret: string, now = Date.now()): Promise<string> {
  const nowSec = Math.floor(now / 1000)
  return new SignJWT({})
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + TOKEN_TTL_SECONDS)
    .sign(new TextEncoder().encode(secret))
}

/**
 * Verify a sync token. Resolves to `{ userId }` or rejects with
 * `Error('Invalid auth token')` on any failure (bad signature, wrong
 * issuer, expired, missing sub).
 */
export async function verifyToken(token: string, secret: string): Promise<{ userId: string }> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: ISSUER,
      algorithms: ['HS256'],
    })
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new Error('missing sub')
    }
    return { userId: payload.sub }
  } catch {
    throw new Error('Invalid auth token')
  }
}

/** The only storeId a user may sync: derived from the token, never client-trusted. */
export function storeIdForUser(userId: string): string {
  return `user-${userId}`
}

/**
 * Authorization boundary for sync traffic. Validates the client-supplied
 * payload (raw JSON from the WS/HTTP transport), verifies the JWT and
 * enforces `storeId === user-<sub>`. Used both by the Worker's
 * `validatePayload` (connection time) and by the sync DO's `onPush`/`onPull`
 * callbacks (per push/pull).
 */
export async function authorizeSync(payload: unknown, storeId: string, secret: string): Promise<{ userId: string }> {
  let authToken: string | undefined
  if (typeof payload === 'object' && payload !== null && 'authToken' in payload) {
    const candidate = payload.authToken
    if (typeof candidate === 'string') {
      authToken = candidate
    }
  }
  if (authToken === undefined || authToken === '') {
    throw new Error('Missing auth token')
  }
  const { userId } = await verifyToken(authToken, secret)
  if (storeId !== storeIdForUser(userId)) {
    throw new Error('Forbidden store')
  }
  return { userId }
}
