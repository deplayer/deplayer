import { DurableObject } from 'cloudflare:workers'
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server'
import type { Env } from './env'

const CHALLENGE_TTL_MS = 5 * 60 * 1000

/**
 * WebAuthn (passkey) authentication Durable Object.
 *
 * Single instance (addressed via `idFromName('global')`). Stores users,
 * passkey credentials and short-lived challenges in DO SQLite.
 *
 * All verify endpoints take the browser Origin explicitly; the Worker has
 * already checked it against `ALLOWED_ORIGINS` before calling here.
 */
export class AuthDO extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS credentials (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        public_key BLOB NOT NULL,
        counter INTEGER NOT NULL,
        transports TEXT
      );
      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        challenge TEXT NOT NULL,
        kind TEXT NOT NULL,
        user_id TEXT,
        user_name TEXT,
        expires_at INTEGER NOT NULL
      );
    `)
  }

  /**
   * Run a query and return its first row, or `undefined` when there is none.
   * (`cursor.one()` throws on zero rows, so it can't be used for
   * existence checks.)
   */
  private selectOne(query: string, ...params: SqlStorageValue[]): Record<string, SqlStorageValue> | undefined {
    const { done, value } = this.ctx.storage.sql.exec(query, ...params).next()
    return done ? undefined : value
  }
  /** Start passkey registration for a new account name. */
  async registerOptions(name: string): Promise<{ challengeId: string; options: PublicKeyCredentialCreationOptionsJSON }> {
    this.deleteExpiredChallenges()
    const trimmed = name.trim()
    if (trimmed.length === 0 || trimmed.length > 64) {
      throw new Error('Invalid name')
    }
    const existing = this.selectOne('SELECT id FROM users WHERE name = ?', trimmed)
    if (existing) {
      throw new Error('Name taken')
    }
    const userId = crypto.randomUUID()
    const options = await generateRegistrationOptions({
      rpName: this.env.RP_NAME,
      rpID: this.env.RP_ID,
      userName: trimmed,
      userID: new Uint8Array(new TextEncoder().encode(userId)),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    })
    const challengeId = crypto.randomUUID()
    this.ctx.storage.sql.exec(
      'INSERT INTO challenges (id, challenge, kind, user_id, user_name, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      challengeId,
      options.challenge,
      'register',
      userId,
      trimmed,
      Date.now() + CHALLENGE_TTL_MS,
    )
    return { challengeId, options }
  }

  /** Verify a registration response; creates the user + credential. */
  async registerVerify(challengeId: string, response: RegistrationResponseJSON, origin: string): Promise<{ userId: string }> {
    this.deleteExpiredChallenges()
    const challenge = this.loadChallenge(challengeId, 'register')
    const result = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: this.env.RP_ID,
      requireUserVerification: false,
    })
    if (!result.verified || result.registrationInfo === undefined) {
      throw new Error('Registration verification failed')
    }
    if (challenge.user_id === null || challenge.user_name === null) {
      throw new Error('Challenge has no user')
    }
    const credential = result.registrationInfo.credential
    const now = Date.now()
    this.ctx.storage.sql.exec('INSERT INTO users (id, name, created_at) VALUES (?, ?, ?)', challenge.user_id, challenge.user_name, now)
    this.ctx.storage.sql.exec(
      'INSERT INTO credentials (id, user_id, public_key, counter, transports) VALUES (?, ?, ?, ?, ?)',
      credential.id,
      challenge.user_id,
        new Uint8Array(credential.publicKey),
      credential.counter,
      JSON.stringify(credential.transports ?? []),
    )
    return { userId: challenge.user_id }
  }

  /** Start passkey login (discoverable — the client chooses the credential). */
  async loginOptions(): Promise<{ challengeId: string; options: PublicKeyCredentialRequestOptionsJSON }> {
    this.deleteExpiredChallenges()
    const options = await generateAuthenticationOptions({
      rpID: this.env.RP_ID,
      userVerification: 'preferred',
    })
    const challengeId = crypto.randomUUID()
    this.ctx.storage.sql.exec(
      'INSERT INTO challenges (id, challenge, kind, user_id, user_name, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      challengeId,
      options.challenge,
      'login',
      null,
      null,
      Date.now() + CHALLENGE_TTL_MS,
    )
    return { challengeId, options }
  }

  /** Verify a login response; resolves the credential to user + display name. */
  async loginVerify(challengeId: string, response: AuthenticationResponseJSON, origin: string): Promise<{ userId: string; name: string }> {
    this.deleteExpiredChallenges()
    const challenge = this.loadChallenge(challengeId, 'login')
    const credentialRow = this.selectOne(
      'SELECT user_id, public_key, counter FROM credentials WHERE id = ?',
      response.id
    )
    if (credentialRow === undefined) {
      throw new Error('Unknown credential')
    }
    const publicKeyValue = credentialRow.public_key
    if (publicKeyValue === null || typeof publicKeyValue !== 'object') {
      throw new Error('Corrupt credential')
    }
    const publicKey = new Uint8Array(publicKeyValue)
    if (publicKey.length === 0) {
      throw new Error('Corrupt credential')
    }
    const counterValue = credentialRow.counter
    if (typeof counterValue !== 'number') {
      throw new Error('Corrupt credential')
    }
    // Login is discoverable: the challenge has no user, so the account is
    // resolved from the credential the user actually presented.
    const userId = credentialRow.user_id
    if (typeof userId !== 'string') {
      throw new Error('Credential has no user')
    }
    const result = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: this.env.RP_ID,
      credential: {
        id: response.id,
        publicKey,
        counter: counterValue,
      },
      requireUserVerification: false,
    })
    if (!result.verified) {
      throw new Error('Authentication failed')
    }
    this.ctx.storage.sql.exec('UPDATE credentials SET counter = ? WHERE id = ?', result.authenticationInfo.newCounter, response.id)
    const userRow = this.selectOne('SELECT name FROM users WHERE id = ?', userId)
    if (userRow === undefined || typeof userRow.name !== 'string') {
      throw new Error('User not found')
    }
    return { userId, name: userRow.name }
  }

  private deleteExpiredChallenges(): void {
    this.ctx.storage.sql.exec('DELETE FROM challenges WHERE expires_at < ?', Date.now())
  }

  /**
   * Load and delete a challenge row of the given kind.
   * Throws when the challenge is missing, expired or of the wrong kind.
   */
  private loadChallenge(challengeId: string, kind: 'register' | 'login'): {
    challenge: string
    user_id: string | null
    user_name: string | null
  } {
    const row = this.selectOne(
      'SELECT challenge, kind, user_id, user_name FROM challenges WHERE id = ?',
      challengeId
    )
    if (row === undefined || row.kind !== kind || typeof row.challenge !== 'string') {
      throw new Error('Challenge expired')
    }
    this.ctx.storage.sql.exec('DELETE FROM challenges WHERE id = ?', challengeId)
    return {
      challenge: row.challenge,
      user_id: typeof row.user_id === 'string' ? row.user_id : null,
      user_name: typeof row.user_name === 'string' ? row.user_name : null,
    }
  }
}
