import { describe, it, expect } from 'vitest'

import {
  createProvider,
  emptyConfigFor,
  nextInstanceKey,
  providerSchemaOf,
  providerTypeOf,
} from './registry'

describe('provider registry', () => {
  it('derives the type from first and repeated instance keys', () => {
    expect(providerTypeOf('subsonic')).toBe('subsonic')
    expect(providerTypeOf('subsonic2')).toBe('subsonic')
    expect(providerTypeOf('jellyfin12')).toBe('jellyfin')
  })

  it('resolves the schema through the instance key', () => {
    expect(providerSchemaOf('subsonic3')?.key).toBe('subsonic')
    expect(providerSchemaOf('nope')).toBeUndefined()
  })

  it('picks the first free instance key', () => {
    expect(nextInstanceKey([], 'subsonic')).toBe('subsonic')
    expect(nextInstanceKey(['subsonic'], 'subsonic')).toBe('subsonic1')
    expect(nextInstanceKey(['subsonic', 'subsonic1', 'subsonic3'], 'subsonic')).toBe('subsonic2')
  })

  it('builds a blank enabled config with every credential empty', () => {
    expect(emptyConfigFor(providerSchemaOf('subsonic')!)).toEqual({
      enabled: true,
      baseUrl: '',
      user: '',
      password: '',
    })
  })

  it('constructs repeated instances with the TYPE as providerKey', () => {
    const p = createProvider('subsonic2', { baseUrl: 'http://x', user: 'u', password: 'p' })
    expect(p?.providerKey).toBe('subsonic')
  })

  it('returns undefined for types without an implementation', () => {
    expect(createProvider('musicbrainz', { enabled: true })).toBeUndefined()
    expect(createProvider('unknown', {})).toBeUndefined()
  })

  it('returns undefined when construction throws', () => {
    // jellyfin's constructor calls settings.baseUrl.replace on undefined
    expect(createProvider('jellyfin', {})).toBeUndefined()
  })
})
