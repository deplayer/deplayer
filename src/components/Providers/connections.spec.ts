import { describe, it, expect } from 'vitest'

import { configuredTypes, withAdded, withEnabled, withoutInstance, withSaved } from './connections'

describe('provider connections', () => {
  it('merges a saved slice over the stored config without dropping other fields', () => {
    const next = withSaved({ s: { enabled: true, user: 'a', baseUrl: 'x' } }, 's', { user: 'b' })
    expect(next.s).toEqual({ enabled: true, user: 'b', baseUrl: 'x' })
  })

  it('toggles enabled without touching credentials', () => {
    expect(withEnabled({ s: { enabled: true, user: 'a' } }, 's', false).s).toEqual({ enabled: false, user: 'a' })
  })

  it('removes only the named instance', () => {
    expect(Object.keys(withoutInstance({ a: {}, b: {} }, 'a'))).toEqual(['b'])
  })

  it('adds a repeatable type under the next free key', () => {
    const next = withAdded({ subsonic: { enabled: true } }, 'subsonic')
    expect(Object.keys(next ?? {})).toEqual(['subsonic', 'subsonic1'])
    expect(next?.subsonic1).toMatchObject({ enabled: true, baseUrl: '' })
  })

  it('refuses a second instance of a non-repeatable type and unknown types', () => {
    expect(withAdded({ itunes: { enabled: true } }, 'itunes')).toBeUndefined()
    expect(withAdded({}, 'nope')).toBeUndefined()
  })

  it('lists distinct configured types', () => {
    expect(configuredTypes({ subsonic: {}, subsonic1: {}, jellyfin: {} })).toEqual(['subsonic', 'jellyfin'])
  })
})
