import { describe, it, expect } from 'vitest'
import { hasAnyProviderOf } from './hasAnyProviderOf'
import type { Stream } from '../types/media'

describe('hasAnyProviderOf', () => {
  const stream: Record<string, Stream> = {
    spotify1: { service: 'spotify', uris: [{ uri: 'spotify:track:123' }] },
    youtube1: { service: 'youtube', uris: [{ uri: 'https://youtube.com/watch?v=abc' }] },
  }

  it('returns true when a provider matches', () => {
    expect(hasAnyProviderOf(stream, ['spotify'])).toBe(true)
  })

  it('returns true when provider is a prefix of service', () => {
    expect(hasAnyProviderOf(stream, ['you'])).toBe(true)
  })

  it('returns false when no provider matches', () => {
    expect(hasAnyProviderOf(stream, ['soundcloud', 'bandcamp'])).toBe(false)
  })

  it('returns false for empty providers list', () => {
    expect(hasAnyProviderOf(stream, [])).toBe(false)
  })

  it('returns false for empty stream', () => {
    expect(hasAnyProviderOf({}, ['spotify'])).toBe(false)
  })
})
