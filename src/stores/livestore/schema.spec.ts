import { describe, it, expect } from 'vitest'
import { schema, tables } from './schema'

/**
 * Assert that performance-critical indexes are declared on the owning
 * LiveStore tables, not applied via raw CREATE INDEX after boot.
 * LiveStore builds/rebuilds these from the schema declaratively.
 */

interface IndexDef {
  readonly name: string
  readonly columns: readonly string[]
}

function getTableIndexes(tableName: string): IndexDef[] {
  // @ts-expect-error accessing internal sqliteDef for schema contract test
  const sqliteDef = tables[tableName]?.sqliteDef
  if (!sqliteDef) throw new Error(`Table ${tableName} not found in schema`)
  return (sqliteDef.indexes ?? []) as IndexDef[]
}

function indexNames(tableName: string): string[] {
  return getTableIndexes(tableName).map((i) => i.name)
}

describe('LiveStore schema indexes', () => {
  describe('media table', () => {
    it('has all performance-critical media indexes declared declaratively', () => {
      const names = indexNames('media')
      const expected = [
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
      ]
      for (const idx of expected) {
        expect(names, `missing index ${idx}`).toContain(idx)
      }
    })

    it('idx_media_artist_album is a compound index on artistId, albumId', () => {
      const idx = getTableIndexes('media').find((i) => i.name === 'idx_media_artist_album')
      expect(idx?.columns).toEqual(['artistId', 'albumId'])
    })

    it('idx_media_artist_type is a compound index on artistId, type', () => {
      const idx = getTableIndexes('media').find((i) => i.name === 'idx_media_artist_type')
      expect(idx?.columns).toEqual(['artistId', 'type'])
    })
  })

  describe('albums table', () => {
    it('has all album indexes declared declaratively', () => {
      const names = indexNames('albums')
      const expected = [
        'idx_albums_artistId',
        'idx_albums_name',
        'idx_albums_year',
      ]
      for (const idx of expected) {
        expect(names, `missing index ${idx}`).toContain(idx)
      }
    })
  })

  describe('other tables', () => {
    it('has idx_favorites_mediaId on favorites', () => {
      expect(indexNames('favorites')).toContain('idx_favorites_mediaId')
    })

    it('has idx_lyrics_mediaId on media_lyrics table', () => {
      // The table key in the schema object is 'lyrics', underlying name is 'media_lyrics'.
      expect(indexNames('lyrics')).toContain('idx_lyrics_mediaId')
    })

    it('has idx_smartPlaylists_name on smart_playlists', () => {
      expect(indexNames('smartPlaylists')).toContain('idx_smartPlaylists_name')
    })
  })

  describe('already-declarative tables remain unchanged', () => {
    it('mediaGenres retains its existing declarative indexes', () => {
      const names = indexNames('mediaGenres')
      expect(names).toContain('idx_media_genres_genre')
      expect(names).toContain('idx_media_genres_mediaId')
    })

    it('playbackHistory retains its existing declarative index', () => {
      const names = indexNames('playbackHistory')
      expect(names).toContain('idx_playback_history_played_at')
    })
  })
})

/**
 * The playback queue's write budget.
 *
 * Toggling shuffle must not touch the track rows: a 60k-track queue rewrote
 * `queue_items` (120k rows) on every toggle, which measured ~3.5s. These
 * tests pin the statement counts so that regression cannot come back
 * unnoticed.
 */
describe('LiveStore queue materializer write budget', () => {
  const materialize = (eventName: string, args: Record<string, unknown>) => {
    const materializer = schema.state.materializers.get(eventName)
    if (!materializer) throw new Error(`No materializer for ${eventName}`)
    return materializer(args, undefined as never)
  }

  it('toggling shuffle writes a single queue row, whatever the queue length', () => {
    const randomOrder = Array.from({ length: 60_000 }, (_, i) => i)
    const result = materialize('v1.QueueShuffleToggled', {
      queueId: 'default',
      shuffle: true,
      currentPlaying: 0,
      randomOrder,
    })

    // One statement, and it must not touch the track rows.
    expect(Array.isArray(result)).toBe(false)
    expect(String(result)).not.toContain('queue_items')
  })

  it('replacing the queue writes one ordered row per track plus the head', () => {
    const trackIds = Array.from({ length: 1_000 }, (_, i) => `t${i}`)
    const result = materialize('v1.QueueUpdated', {
      id: 'default',
      trackIds,
      currentPlaying: 0,
      shuffle: false,
      repeat: false,
    }) as unknown as unknown[]

    // head + delete-all + one insert per ordered track (no random-list rows)
    expect(result).toHaveLength(2 + trackIds.length)
  })

  it('clearing the queue clears the stored permutation too', () => {
    const result = materialize('v1.QueueCleared', { queueId: 'default' }) as unknown as unknown[]
    const sql = result.map((r) => String(r)).join('\n')
    expect(sql).toContain('randomOrder')
  })
})
