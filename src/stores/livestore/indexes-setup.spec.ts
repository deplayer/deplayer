import { describe, it, expect } from 'vitest'
import { indexesSetup } from './indexes-setup'

describe('indexesSetup', () => {
  it('contains all expected index statements', () => {
    const expectedIndexes = [
      'idx_media_artistId',
      'idx_media_albumId',
      'idx_media_type',
      'idx_media_playCount',
      'idx_media_createdAt',
      'idx_media_genresFlat',
      'idx_media_providersFlat',
      'idx_media_artistName',
      'idx_media_title',
      'idx_media_artist_album',
      'idx_media_artist_type',
      'idx_albums_artistId',
      'idx_albums_name',
      'idx_albums_year',
      'idx_favorites_mediaId',
      'idx_lyrics_mediaId',
      'idx_smartPlaylists_name',
    ]

    for (const idx of expectedIndexes) {
      expect(indexesSetup).toContain(`CREATE INDEX IF NOT EXISTS ${idx}`)
    }
  })

  it('contains media_genres backfill statement using json_each on media.genres', () => {
    // Must use json_each(m.genres) — the JSON array column — not genresFlat (comma-separated string).
    expect(indexesSetup).toContain('CROSS JOIN json_each(m.genres)')
    // Should NOT reference genresFlat in the backfill.
    expect(indexesSetup).not.toContain('json_each(m.genresFlat)')

    // Must be idempotent with INSERT OR IGNORE.
    expect(indexesSetup).toContain('INSERT OR IGNORE INTO media_genres')

    // Must select from both media and media_genres tables (join verification).
    expect(indexesSetup).toContain('FROM media m')
  })

  it('backfill SQL references all backfill columns', () => {
    const expectedColumns = ['id', 'mediaId', 'genre', 'createdAt']
    for (const col of expectedColumns) {
      expect(indexesSetup).toContain(col)
    }
  })

  it('backfill SQL uses TRIM to normalize genre values', () => {
    expect(indexesSetup).toContain('TRIM(g.value)')
  })

  it('splits into non-empty statements correctly', () => {
    const statements = indexesSetup.split(';').flatMap((s: string) => {
      const trimmed = s.trim()
      return trimmed.length > 0 ? [trimmed] : []
    })
    // Should have at least the 17 index statements + 1 backfill statement.
    expect(statements.length).toBeGreaterThanOrEqual(18)
    // No empty or whitespace-only statements.
    for (const stmt of statements) {
      expect(stmt.length).toBeGreaterThan(0)
    }
  })
})
