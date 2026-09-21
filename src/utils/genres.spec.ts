import { describe, it, expect } from 'vitest'
import { normalizeGenres, parseGenresCsv } from './genres'

describe('normalizeGenres', () => {
  it('trims entries', () => {
    expect(normalizeGenres(['Rock ', ' Punk'])).toEqual(['Rock', 'Punk'])
  })

  it('drops blank entries', () => {
    expect(normalizeGenres(['Rock', '', '   ', 'Punk'])).toEqual(['Rock', 'Punk'])
  })

  it('deduplicates', () => {
    expect(normalizeGenres(['Rock', 'Rock', 'Punk'])).toEqual(['Rock', 'Punk'])
  })

  it('treats a bare string as a single genre', () => {
    // A comma inside a single provider value is a formatting bug, not a split.
    expect(normalizeGenres('Rock')).toEqual(['Rock'])
    expect(normalizeGenres('Rock,Pop')).toEqual(['Rock,Pop'])
  })

  it('returns an empty list for absent or empty input', () => {
    expect(normalizeGenres(undefined)).toEqual([])
    expect(normalizeGenres(null)).toEqual([])
    expect(normalizeGenres([])).toEqual([])
    expect(normalizeGenres('')).toEqual([])
  })

  it('produces the same list the comma-joined column is written from', () => {
    // Both genre representations are written from this result, so a
    // whitespace-padded input must not yield 'Rock ,Punk' anywhere.
    expect(normalizeGenres(['Rock ', ' Punk', 'Rock']).join(',')).toBe('Rock,Punk')
  })
})

describe('parseGenresCsv', () => {
  it('splits entries, trimming each and dropping blanks', () => {
    expect(parseGenresCsv(' rock , ,punk ')).toEqual(['rock', 'punk'])
  })

  it('returns an empty list for absent or non-string input', () => {
    expect(parseGenresCsv(undefined)).toEqual([])
    expect(parseGenresCsv(null)).toEqual([])
    expect(parseGenresCsv(42)).toEqual([])
    expect(parseGenresCsv('')).toEqual([])
  })

  it('round-trips the encoding the column is written with', () => {
    const genres = normalizeGenres([' Rock ', 'Punk', 'Rock', ''])
    expect(parseGenresCsv(genres.join(','))).toEqual(genres)
  })
})
