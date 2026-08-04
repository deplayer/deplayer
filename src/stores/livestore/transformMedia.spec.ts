import { describe, it, expect } from 'vitest'
import { rawToMediaRow } from './transformMedia'

describe('rawToMediaRow', () => {
  it('parses a full media row with JSON fields as strings', () => {
    const raw = {
      id: 'm1', title: 'Song', artistId: 'a1', artistName: 'Artist',
      albumId: 'al1', albumName: 'Album', type: 'audio', duration: 200000,
      stream: JSON.stringify({ spotify: { uri: 'x' } }),
      cover: JSON.stringify({ thumbnailUrl: 'https://img.jpg' }),
      genres: JSON.stringify(['rock']),
    }
    const row = rawToMediaRow(raw)
    expect(row).not.toBeNull()
    expect(row!.stream).toEqual({ spotify: { uri: 'x' } })
    expect(row!.cover).toEqual({ thumbnailUrl: 'https://img.jpg' })
    expect(row!.genres).toEqual(['rock'])
  })

  it('handles already-parsed JSON fields (idempotent)', () => {
    const raw = {
      id: 'm1', title: 'Song', artistId: 'a1', artistName: 'Artist',
      albumId: 'al1', albumName: 'Album', type: 'audio', duration: 200000,
      stream: { spotify: {} }, cover: null, genres: [],
    }
    const row = rawToMediaRow(raw)
    expect(row!.stream).toEqual({ spotify: {} })
    expect(row!.genres).toEqual([])
  })

  it('returns null for null input', () => {
    expect(rawToMediaRow(null)).toBeNull()
    expect(rawToMediaRow(undefined)).toBeNull()
  })

  it('returns null for non-object input', () => {
    expect(rawToMediaRow(42)).toBeNull()
    expect(rawToMediaRow('song')).toBeNull()
    expect(rawToMediaRow(true)).toBeNull()
    expect(rawToMediaRow([])).toBeNull()
  })

  it('handles malformed JSON gracefully', () => {
    const raw = {
      id: 'm1', title: 'Song', artistId: '', artistName: '',
      albumId: '', albumName: '', type: 'audio', duration: 0,
      stream: 'not-json', cover: 'broken', genres: '[]',
    }
    const row = rawToMediaRow(raw)
    expect(row!.stream).toEqual({})
    expect(row!.cover).toBeNull()
    expect(row!.genres).toEqual([])
  })

  it('does not build nested artist/album objects', () => {
    const raw = {
      id: 'm1', title: 'Song', artistId: 'a1', artistName: 'The Band',
      albumId: 'al1', albumName: 'Great Album', type: 'audio', duration: 100,
      stream: {}, cover: null, genres: [],
    }
    const row = rawToMediaRow(raw)!
    expect(row.artistId).toBe('a1')
    expect(row.artistName).toBe('The Band')
    expect('artist' in row).toBe(false)
    expect('album' in row).toBe(false)
  })
})
