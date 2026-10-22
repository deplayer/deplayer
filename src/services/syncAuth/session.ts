/**
 * In-memory + localStorage persistence for the LiveStore sync session
 * (JWT minted by the sync worker after passkey register/login).
 */
export interface SyncSession {
  /** HS256 JWT, 30-day TTL, sub = userId. Sent as `syncPayload.authToken`. */
  token: string
  userId: string
  name: string
}

const SESSION_KEY = 'deplayer-sync-session'

/** Decode the base64url payload of a JWT (middle segment) as JSON. */
const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * The persisted session, or `null` when missing, malformed, or expired
 * (JWT `exp` in the past). Expired sessions are dropped on read so the
 * UI returns to the signed-out state.
 */
export const getSyncSession = (): SyncSession | null => {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
  if (raw === null) {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return null
  }
  const candidate = parsed as Partial<SyncSession>
  if (typeof candidate.token !== 'string' || typeof candidate.userId !== 'string' || typeof candidate.name !== 'string') {
    return null
  }
  const payload = decodeJwtPayload(candidate.token)
  if (payload === null || typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
  return candidate as SyncSession
}

export const setSyncSession = (session: SyncSession): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export const clearSyncSession = (): void => {
  localStorage.removeItem(SESSION_KEY)
}
