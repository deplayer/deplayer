import { describe, it, expect } from 'vitest'
import { partitionSyncBatch, type ExistingMediaRow } from './mediaDiff'
import type { NormalizedMedia } from '../../../utils/normalizeMedia'

const makeItem = (overrides: Record<string, unknown> = {}): NormalizedMedia =>
  ({
    media: {
      id: 'm1',
      title: 'Title',
      type: 'audio',
      duration: 180_000,
      discNumber: 1,
      genres: ['Rock', 'Alt'],
      stream: { subsonic: 'u1', jellyfin: 'u2' },
      externalId: 'e1',
      shareUrl: 's1',
      filePath: '/p1',
      ...overrides,
    },
    artist: { id: 'a1', name: 'Artist' },
    album: { id: 'al1', name: 'Album', artistId: 'a1', thumbnailUrl: null, year: null },
  }) as unknown as NormalizedMedia

/** The row exactly as makeItem's defaults would have been stored. */
const matchingRow = (overrides: Partial<ExistingMediaRow> = {}): ExistingMediaRow => ({
  id: 'm1',
  type: 'audio',
  duration: 180_000,
  discNumber: 1,
  genresFlat: 'Rock,Alt',
  providersFlat: 'subsonic,jellyfin',
  externalId: 'e1',
  shareUrl: 's1',
  filePath: '/p1',
  ...overrides,
})

const partition = (items: NormalizedMedia[], rows: ExistingMediaRow[]) =>
  partitionSyncBatch(items, new Map(rows.map(r => [r.id, r])))

describe('partitionSyncBatch', () => {
  it('routes ids absent from the database to newItems', () => {
    const { newItems, changedItems } = partition([makeItem()], [])
    expect(newItems).toHaveLength(1)
    expect(changedItems).toHaveLength(0)
  })

  it('drops rows with no drift in the comparable fields', () => {
    const { newItems, changedItems } = partition([makeItem()], [matchingRow()])
    expect(newItems).toHaveLength(0)
    expect(changedItems).toHaveLength(0)
  })

  it('treats null row columns as absent (null/undefined normalization)', () => {
    // Everything optional is null in the row and absent/empty in the item.
    const item = makeItem({
      duration: undefined,
      discNumber: undefined,
      externalId: undefined,
      shareUrl: undefined,
      filePath: undefined,
      genres: [],
      stream: {},
    })
    const row = matchingRow({
      duration: null,
      discNumber: null,
      externalId: null,
      shareUrl: null,
      filePath: null,
      genresFlat: '',
      providersFlat: '',
    })
    const { newItems, changedItems } = partition([item], [row])
    expect(newItems).toHaveLength(0)
    expect(changedItems).toHaveLength(0)
  })

  it.each([
    ['type', { type: 'video' }],
    ['duration', { duration: 200_000 }],
    ['discNumber', { discNumber: 2 }],
    ['externalId', { externalId: 'e2' }],
    ['shareUrl', { shareUrl: 's2' }],
    ['filePath', { filePath: '/p2' }],
  ] as const)('routes drift in %s to changedItems', (_field, overrides) => {
    const { changedItems } = partition([makeItem(overrides)], [matchingRow()])
    expect(changedItems).toHaveLength(1)
  })

  it('routes genre drift (order and membership) to changedItems', () => {
    expect(partition([makeItem({ genres: ['Alt', 'Rock'] })], [matchingRow()]).changedItems).toHaveLength(1)
    expect(partition([makeItem({ genres: ['Rock'] })], [matchingRow()]).changedItems).toHaveLength(1)
  })
  it('partitions a mixed batch in one pass, preserving order within each route', () => {
    const unchanged = makeItem({ id: 'm1' })
    const fresh = makeItem({ id: 'm2' })
    const drifted = makeItem({ id: 'm3', duration: 999 })
    const { newItems, changedItems } = partition([unchanged, fresh, drifted], [matchingRow(), matchingRow({ id: 'm3' })])
    expect(newItems.map(i => i.media.id)).toEqual(['m2'])
    expect(changedItems.map(i => i.media.id)).toEqual(['m3'])
  })

  it('ignores stream-URL rotation within the same provider set', () => {
    // Token/URL rotation without membership change is not an update.
    const item = makeItem({ stream: { subsonic: 'ROTATED', jellyfin: 'ALSO-ROTATED' } })
    expect(partition([item], [matchingRow()]).changedItems).toHaveLength(0)
  })
})
