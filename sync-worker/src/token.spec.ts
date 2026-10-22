// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { authorizeSync, issueToken, verifyToken } from './token'

const SECRET = 'test-secret-0123456789-abcdefghijklmnopqrstuvwxyz'
const OTHER_SECRET = 'other-secret-0123456789-abcdefghijklmnopqrstuvwx'
const DAY_MS = 24 * 3600 * 1000

describe('issueToken / verifyToken', () => {
  it('round-trips the userId', async () => {
    const token = await issueToken('user-123', SECRET)
    await expect(verifyToken(token, SECRET)).resolves.toEqual({ userId: 'user-123' })
  })

  it('rejects a token signed with a different secret', async () => {
    const token = await issueToken('user-123', OTHER_SECRET)
    await expect(verifyToken(token, SECRET)).rejects.toThrow('Invalid auth token')
  })

  it('rejects a token past its 30-day expiry', async () => {
    const token = await issueToken('user-123', SECRET, Date.now() - 31 * DAY_MS)
    await expect(verifyToken(token, SECRET)).rejects.toThrow('Invalid auth token')
  })

  it('accepts a token minted within the expiry window', async () => {
    const token = await issueToken('user-123', SECRET, Date.now() - 29 * DAY_MS)
    await expect(verifyToken(token, SECRET)).resolves.toEqual({ userId: 'user-123' })
  })

  it('rejects a tampered token', async () => {
    const token = await issueToken('user-123', SECRET)
    const tampered = token.slice(0, -3) + 'aaa'
    await expect(verifyToken(tampered, SECRET)).rejects.toThrow('Invalid auth token')
  })

  it('rejects a token with an empty subject', async () => {
    const token = await issueToken('', SECRET)
    await expect(verifyToken(token, SECRET)).rejects.toThrow('Invalid auth token')
  })
})

describe('authorizeSync', () => {
  it('accepts a valid payload for the owner storeId', async () => {
    const token = await issueToken('alice', SECRET)
    await expect(authorizeSync({ authToken: token }, 'user-alice', SECRET)).resolves.toEqual({
      userId: 'alice',
    })
  })

  it('rejects a forbidden storeId', async () => {
    const token = await issueToken('alice', SECRET)
    await expect(authorizeSync({ authToken: token }, 'user-bob', SECRET)).rejects.toThrow('Forbidden store')
  })

  it('rejects a payload without authToken', async () => {
    await expect(authorizeSync({}, 'user-123', SECRET)).rejects.toThrow('Missing auth token')
    await expect(authorizeSync(null, 'user-123', SECRET)).rejects.toThrow('Missing auth token')
    await expect(authorizeSync('a-string', 'user-123', SECRET)).rejects.toThrow('Missing auth token')
    await expect(authorizeSync({ authToken: 42 }, 'user-123', SECRET)).rejects.toThrow('Missing auth token')
  })

  it('rejects an invalid token inside a well-formed payload', async () => {
    await expect(authorizeSync({ authToken: 'not-a-jwt' }, 'user-123', SECRET)).rejects.toThrow('Invalid auth token')
  })
})
