import { describe, it, expect } from 'vitest'
import { generateArtistId, generateAlbumId, generateMediaId } from './generateIds'

describe('generateArtistId', () => {
  it('slugifies the artist name', () => {
    expect(generateArtistId('Pink Floyd')).toBe('pink-floyd')
  })

  it('handles accented characters', () => {
    expect(generateArtistId('Beyoncé')).toBe('beyonce')
  })

  it('falls back to undefined-artist for empty string', () => {
    expect(generateArtistId('')).toBe('undefined-artist')
  })

  it('handles special characters', () => {
    expect(generateArtistId('AC/DC')).toBe('ac-dc')
  })
})

describe('generateAlbumId', () => {
  it('combines artist and album name', () => {
    expect(generateAlbumId('The Wall', 'Pink Floyd')).toBe('pink-floyd-the-wall')
  })

  it('falls back to undefined-album for empty album', () => {
    expect(generateAlbumId('', 'Pink Floyd')).toBe('pink-floyd-undefined-album')
  })

  it('falls back to undefined-artist for empty artist', () => {
    expect(generateAlbumId('The Wall', '')).toBe('undefined-artist-the-wall')
  })

  it('falls back to both defaults for empty strings', () => {
    expect(generateAlbumId('', '')).toBe('undefined-artist-undefined-album')
  })

  it('handles accented characters', () => {
    expect(generateAlbumId('Café del Mar', 'José')).toBe('jose-cafe-del-mar')
  })
})

describe('generateMediaId', () => {
  it('generates a slugified id from components', () => {
    const id = generateMediaId({
      title: 'Comfortably Numb',
      artistName: 'Pink Floyd',
      albumName: 'The Wall',
      track: 6,
    })
    expect(id).toBe('pink-floyd-the-wall-0006-comfortably-numb')
  })

  it('uses forcedId when provided', () => {
    const id = generateMediaId({
      title: 'Anything',
      artistName: 'Anyone',
      albumName: 'Something',
      forcedId: 'my-forced-id',
    })
    expect(id).toBe('my-forced-id')
  })

  it('includes disc number when present', () => {
    const id = generateMediaId({
      title: 'Track One',
      artistName: 'Artist',
      albumName: 'Album',
      track: 1,
      discNumber: 2,
    })
    expect(id).toBe('artist-album-02-0001-track-one')
  })

  it('handles null track', () => {
    const id = generateMediaId({
      title: 'Song',
      artistName: 'Artist',
      albumName: 'Album',
      track: null,
    })
    expect(id).toBe('artist-album-0000-song')
  })

  it('handles undefined track', () => {
    const id = generateMediaId({
      title: 'Song',
      artistName: 'Artist',
      albumName: 'Album',
    })
    expect(id).toBe('artist-album-0000-song')
  })

  it('handles special characters in title', () => {
    const id = generateMediaId({
      title: "Don't Stop Me Now!",
      artistName: 'Queen',
      albumName: 'Jazz',
      track: 12,
    })
    expect(id).toBe('queen-jazz-0012-don-t-stop-me-now')
  })
})
