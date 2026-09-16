import { describe, expect, it } from 'vitest'
import {
  EMPTY_FILTER,
  matchesFilter,
  matchesSearch,
  noopIdsQuery,
  parseFilter,
  parseIds,
  planCollectionQuery,
  rawRowToFilterable,
  type Filter,
  type FilterableMedia,
} from './filter'

const NO_FAVORITES = new Set<string>()

const media = (overrides: Partial<FilterableMedia> = {}): FilterableMedia => ({
  id: 'm1',
  artistId: 'artist-1',
  type: 'audio',
  genres: ['Rock'],
  providers: ['Spotify'],
  title: 'Song Title',
  artistName: 'Artist Name',
  albumName: 'Album Name',
  ...overrides,
})

const filter = (overrides: Partial<Filter> = {}): Filter => ({ ...EMPTY_FILTER, ...overrides })

describe('matchesFilter semantics', () => {
  it('passes everything when no filter is active', () => {
    expect(matchesFilter(filter(), media(), NO_FAVORITES)).toBe(true)
  })

  it('ORs within a category', () => {
    const f = filter({ genres: ['Rock', 'Jazz'] })
    expect(matchesFilter(f, media({ genres: ['Rock'] }), NO_FAVORITES)).toBe(true)
    expect(matchesFilter(f, media({ genres: ['Jazz'] }), NO_FAVORITES)).toBe(true)
    expect(matchesFilter(f, media({ genres: ['Metal'] }), NO_FAVORITES)).toBe(false)
  })

  it('ANDs across categories', () => {
    const f = filter({ genres: ['Rock'], artists: ['artist-2'] })
    // Matches genre but not artist → excluded
    expect(matchesFilter(f, media(), NO_FAVORITES)).toBe(false)
    // Matches both → included
    expect(matchesFilter(f, media({ artistId: 'artist-2' }), NO_FAVORITES)).toBe(true)
  })

  it('matches genres exactly, not by substring', () => {
    const f = filter({ genres: ['Rock'] })
    expect(matchesFilter(f, media({ genres: ['Rockabilly'] }), NO_FAVORITES)).toBe(false)
    expect(matchesFilter(f, media({ genres: ['Rock', 'Pop'] }), NO_FAVORITES)).toBe(true)
  })

  it('matches providers exactly, not by substring', () => {
    const f = filter({ providers: ['Spot'] })
    expect(matchesFilter(f, media({ providers: ['Spotify'] }), NO_FAVORITES)).toBe(false)
  })

  it('requires favorites membership when favorites is active', () => {
    const favs = new Set(['m1'])
    const f = filter({ favorites: true })
    expect(matchesFilter(f, media(), favs)).toBe(true)
    expect(matchesFilter(f, media({ id: 'm2' }), favs)).toBe(false)
  })

  it('ANDs favorites with other categories', () => {
    const favs = new Set(['m1'])
    const f = filter({ favorites: true, genres: ['Rock'] })
    expect(matchesFilter(f, media({ genres: ['Metal'] }), favs)).toBe(false)
    expect(matchesFilter(f, media(), favs)).toBe(true)
  })
})

describe('matchesSearch', () => {
  it('requires a term of at least 3 characters', () => {
    const m = media()
    expect(matchesSearch('ro', m)).toBe(true)
    expect(matchesSearch('son', m)).toBe(true)
    expect(matchesSearch('  song  ', m)).toBe(true)
  })

  it('searches title, artist name, and album name case-insensitively', () => {
    const m = media()
    expect(matchesSearch('song', m)).toBe(true)
    expect(matchesSearch('ARTIST', m)).toBe(true)
    expect(matchesSearch('album name', m)).toBe(true)
    expect(matchesSearch('nope', m)).toBe(false)
  })
})

describe('parseFilter', () => {
  it('returns the empty filter for null/undefined', () => {
    expect(parseFilter(null)).toEqual(EMPTY_FILTER)
    expect(parseFilter(undefined)).toEqual(EMPTY_FILTER)
  })

  it('accepts a canonical filter as-is', () => {
    const f = filter({ genres: ['Rock'], favorites: true })
    expect(parseFilter(f as unknown as Record<string, unknown>)).toEqual(f)
  })

  it('decodes legacy string-array favorites', () => {
    expect(parseFilter({ genres: [], types: [], artists: [], providers: [], favorites: ['true'] })).toMatchObject({ favorites: true })
    expect(parseFilter({ genres: [], types: [], artists: [], providers: [], favorites: ['false'] })).toMatchObject({ favorites: false })
  })

  it('drops missing and malformed categories', () => {
    const parsed = parseFilter({ genres: ['Rock'], types: 'audio' })
    expect(parsed).toEqual(filter({ genres: ['Rock'] }))
  })
})

describe('rawRowToFilterable', () => {
  it('splits denormalized flat columns into arrays', () => {
    const row = rawRowToFilterable({
      id: 'm1',
      artistId: 'a1',
      type: 'audio',
      genresFlat: 'Rock,Pop',
      providersFlat: 'Spotify,Apple',
      title: 'T',
    })
    expect(row.genres).toEqual(['Rock', 'Pop'])
    expect(row.providers).toEqual(['Spotify', 'Apple'])
  })

  it('tolerates missing flat columns', () => {
    const row = rawRowToFilterable({ id: 'm1' })
    expect(row.genres).toEqual([])
    expect(row.providers).toEqual([])
  })
})

describe('parseIds', () => {
  it('handles flat strings, id-rows, and garbage', () => {
    expect(parseIds(['a', { id: 'b' }, null, 42])).toEqual(['a', 'b'])
    expect(parseIds(undefined)).toEqual([])
  })
})

describe('planCollectionQuery', () => {

  it('plans the cheap ids path with no filters', () => {
    expect(planCollectionQuery(filter(), '', []).kind).toBe('ids')
  })

  it('plans the ids path for artists/types/favorites (SQL-expressible)', () => {
    expect(planCollectionQuery(filter({ artists: ['a1'] }), '', []).kind).toBe('ids')
    expect(planCollectionQuery(filter({ types: ['audio'] }), '', []).kind).toBe('ids')
    expect(planCollectionQuery(filter({ favorites: true }), '', ['m1']).kind).toBe('ids')
  })

  it('plans the genre read-model join for genre filters without providers/search', () => {
    expect(planCollectionQuery(filter({ genres: ['Rock'] }), '', []).kind).toBe('genre-ids')
    expect(planCollectionQuery(filter({ genres: ['Rock'], artists: ['a1'], types: ['audio'] }), '', []).kind).toBe('genre-ids')
  })

  it('emits the media_genres join SQL for genre plans', () => {
    const plan = planCollectionQuery(filter({ genres: ['Rock'] }), '', [])
    expect(plan.kind).toBe('genre-ids')
    const query = plan.activeQuery as { label: string; hash: string }
    expect(query.label).toContain('INNER JOIN media_genres mg ON mg.mediaId = m.id')
    expect(query.label).toContain('mg.genre IN (?)')
    expect(query.label).toContain('ORDER BY m.title ASC')
  })

  it('plans the rows path when providers need client-side filtering', () => {
    const plan = planCollectionQuery(filter({ providers: ['Spotify'] }), '', [])
    expect(plan.kind).toBe('rows')
    if (plan.kind !== 'rows') return
    // Genre is now enforced by the shared predicate, not dropped:
    const plan2 = planCollectionQuery(filter({ genres: ['Rock'], providers: ['Spotify'] }), '', [])
    if (plan2.kind !== 'rows') throw new Error('expected rows plan')
    const rockSpotify = { id: 'm1', genresFlat: 'Rock', providersFlat: 'Spotify' }
    const metalSpotify = { id: 'm2', genresFlat: 'Metal', providersFlat: 'Spotify' }
    const rockApple = { id: 'm3', genresFlat: 'Rock', providersFlat: 'Apple' }
    expect(plan2.postFilter(rockSpotify)).toBe(true)
    expect(plan2.postFilter(metalSpotify)).toBe(false)
    expect(plan2.postFilter(rockApple)).toBe(false)
  })

  it('plans the rows path when search is active and post-filters it', () => {
    const plan = planCollectionQuery(filter(), 'song', [])
    expect(plan.kind).toBe('rows')
    if (plan.kind !== 'rows') return
    expect(plan.postFilter({ id: 'm1', title: 'Song One', artistName: '', albumName: '' })).toBe(true)
    expect(plan.postFilter({ id: 'm2', title: 'Other', artistName: '', albumName: '' })).toBe(false)
  })

  it('returns the NOOP ids plan for favorites-on with no favorites', () => {
    const plan = planCollectionQuery(filter({ favorites: true }), '', [])
    expect(plan.kind).toBe('ids')
    // The empty plan must be the shared NOOP query instance, not all media:
    expect(plan.activeQuery).toBe(noopIdsQuery())
    expect(noopIdsQuery()).toBe(noopIdsQuery())
  })

  it('keeps the favorite clause on the genre join plan', () => {
    const plan = planCollectionQuery(filter({ genres: ['Rock'], favorites: true }), '', ['m1', 'm2'])
    expect(plan.kind).toBe('genre-ids')
    const sql = (plan.activeQuery as { label: string }).label
    expect(sql).toContain('INNER JOIN media_genres')
    expect(sql).toContain('m.id IN (?,?)')
  })

  it('emits genre join SQL with bind values for artists and types', () => {
    const plan = planCollectionQuery(
      filter({ genres: ['Rock', 'Jazz'], artists: ['a1'], types: ['audio'] }),
      '',
      [],
    )
    expect(plan.kind).toBe('genre-ids')
    const q = plan.activeQuery as { label: string; hash: string }
    expect(q.label).toContain('mg.genre IN (?,?)')
    expect(q.hash).toBe(q.label + '-1:Rock,2:Jazz,3:a1,4:audio')
  })
})
