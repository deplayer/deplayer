import { describe, expect, it } from 'vitest'
import {
  EMPTY_FILTER,
  buildCollectionClauses,
  collectionAllIdsQuery,
  collectionCountQuery,
  collectionWindowQuery,
  parseFilter,
  parseIds,
  type Filter,
} from './filter'

const filter = (overrides: Partial<Filter> = {}): Filter => ({ ...EMPTY_FILTER, ...overrides })

/** QuerySQL surface used for assertions: label carries the SQL text. */
interface QueryLike {
  label: string
}

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

describe('parseIds', () => {
  it('handles flat strings, id-rows, and garbage', () => {
    expect(parseIds(['a', { id: 'b' }, null, 42])).toEqual(['a', 'b'])
    expect(parseIds(undefined)).toEqual([])
  })
})

describe('buildCollectionClauses', () => {
  it('emits no WHERE for an empty filter without search', () => {
    const c = buildCollectionClauses(filter(), '', [])
    expect(c.where).toBe('')
    expect(c.genreJoin).toBe(false)
    expect(c.bindValues).toEqual([])
  })

  it('ORs within a category via IN lists', () => {
    const c = buildCollectionClauses(filter({ genres: ['Rock', 'Jazz'] }), '', [])
    expect(c.where).toBe('mg.genre IN (?,?)')
    expect(c.genreJoin).toBe(true)
    expect(c.bindValues).toEqual(['Rock', 'Jazz'])
  })

  it('ANDs across categories', () => {
    const c = buildCollectionClauses(filter({ artists: ['a1'], types: ['audio'] }), '', [])
    expect(c.where).toContain(' AND ')
    expect(c.where).toContain('m.artistId IN (?)')
    expect(c.where).toContain('m.type IN (?)')
  })

  it('short-circuits favorites-on with no favorites to an unsatisfiable predicate', () => {
    const c = buildCollectionClauses(filter({ favorites: true }), '', [])
    expect(c.where).toBe('1 = 0')
    expect(c.genreJoin).toBe(false)
  })

  it('ANDs the favorites id list with other categories', () => {
    const c = buildCollectionClauses(filter({ artists: ['a1'], favorites: true }), '', ['m1', 'm2'])
    expect(c.where).toContain('m.artistId IN (?)')
    expect(c.where).toContain('m.id IN (?,?)')
    expect(c.where).toContain(' AND ')
    expect(c.bindValues).toEqual(['a1', 'm1', 'm2'])
  })

  it('matches providers by exact CSV token, not substring', () => {
    const c = buildCollectionClauses(filter({ providers: ['sub'] }), '', [])
    // The comma padding is what makes ',sub,' unable to match 'subsonic'.
    expect(c.where).toContain("(',' || m.providersFlat || ',') LIKE ? ESCAPE '\\'")
    expect(c.bindValues[0]).toBe(',sub,')
  })

  it('ORs multiple providers', () => {
    const c = buildCollectionClauses(filter({ providers: ['sub', 'jam'] }), '', [])
    expect(c.where).toMatch(/\(.*LIKE.*OR.*LIKE.*\)/)
    expect(c.bindValues).toEqual([',sub,', ',jam,'])
  })
  it('ignores search terms shorter than 3 characters', () => {
    expect(buildCollectionClauses(filter(), 'ab', []).where).toBe('')
    expect(buildCollectionClauses(filter(), '  ', []).where).toBe('')
  })

  it('searches title, artist and album with a substring pattern', () => {
    const c = buildCollectionClauses(filter(), 'love', [])
    expect(c.where).toContain("m.title LIKE ? ESCAPE '\\'")
    expect(c.where).toContain("m.artistName LIKE ? ESCAPE '\\'")
    expect(c.where).toContain("m.albumName LIKE ? ESCAPE '\\'")
    expect(c.bindValues).toEqual(['%love%', '%love%', '%love%'])
  })

  it('escapes LIKE wildcards in the search term', () => {
    const c = buildCollectionClauses(filter(), '50%off_', [])
    expect(c.bindValues[0]).toBe('%50\\%off\\_%')
  })
})

describe('collection query builders', () => {
  it('window: plain scan ordered by (title, id) with LIMIT, no join', () => {
    const q = collectionWindowQuery(buildCollectionClauses(filter(), '', []), 250) as QueryLike
    expect(q.label).toContain('FROM media m')
    expect(q.label).not.toContain('media_genres')
    expect(q.label).not.toContain('DISTINCT')
    expect(q.label).toContain('ORDER BY m.title ASC, m.id ASC')
    expect(q.label).toContain('LIMIT 250')
  })

  it('window: genre filters use the media_genres join and DISTINCT', () => {
    const q = collectionWindowQuery(buildCollectionClauses(filter({ genres: ['Rock'] }), '', []), 100) as QueryLike
    expect(q.label).toContain('INNER JOIN media_genres mg ON mg.mediaId = m.id')
    expect(q.label).toContain('DISTINCT')
    expect(q.label).toContain('mg.genre IN (?)')
    expect(q.label).toContain('LIMIT 100')
  })

  it('count: aggregates without the genre join when unfiltered', () => {
    const q = collectionCountQuery(buildCollectionClauses(filter(), '', [])) as QueryLike
    expect(q.label).toContain('SELECT COUNT(m.id) AS count FROM media m')
    expect(q.label).not.toContain('WHERE')
    expect(q.label).not.toContain('media_genres')
  })

  it('count: genre filters aggregate DISTINCT over the join', () => {
    const q = collectionCountQuery(buildCollectionClauses(filter({ genres: ['Rock'] }), '', [])) as QueryLike
    expect(q.label).toContain('COUNT(DISTINCT m.id)')
    expect(q.label).toContain('INNER JOIN media_genres')
  })

  it('allIds: full id list in window order, unbounded', () => {
    const q = collectionAllIdsQuery(buildCollectionClauses(filter(), '', [])) as QueryLike
    expect(q.label).toContain('SELECT m.id AS id FROM media m')
    expect(q.label).toContain('ORDER BY m.title ASC, m.id ASC')
    expect(q.label).not.toContain('LIMIT')
  })

  it('window, count and allIds share identical WHERE semantics', () => {
    const c = buildCollectionClauses(filter({ artists: ['a1'] }), 'love', [])
    const window = (collectionWindowQuery(c, 250) as QueryLike).label
    const count = (collectionCountQuery(c) as QueryLike).label
    const allIds = (collectionAllIdsQuery(c) as QueryLike).label
    const where = 'm.artistId IN (?) AND (m.title LIKE ?'
    expect(window).toContain(where)
    expect(count).toContain(where)
    expect(allIds).toContain(where)
  })
})
