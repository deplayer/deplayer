# Delete Entity Classes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Media/Artist/Album entity classes with LiveStore row types and a single normalization function.

**Architecture:** LiveStore schema becomes the source of truth for domain types. Providers return raw data to a normalizeMedia() function that handles all conversion/defaults/IDs. Components consume row types directly.

**Tech Stack:** TypeScript, LiveStore schema types, Vitest

---

### Task 1: Create row types and utility functions

**Files:**
- Create: `src/types/media.ts`
- Create: `src/utils/generateIds.ts`
- Create: `src/utils/hasAnyProviderOf.ts`
- Test: `src/utils/generateIds.spec.ts`
- Test: `src/utils/hasAnyProviderOf.spec.ts`

**Step 1: Define row types in src/types/media.ts**

Export types that match the LiveStore schema shape. These replace IMedia, IArtist, IAlbum:

```typescript
export type Stream = {
  service: string
  uris: Array<{ uri: string }>
}

export type Cover = {
  thumbnailUrl: string
  fullUrl: string
}

export type MediaRow = {
  id: string
  title: string
  artistId: string
  albumId: string
  artistName: string
  albumName: string
  type: 'audio' | 'video'
  duration: number // always milliseconds
  playCount: number
  track: number | null
  discNumber: number | null
  stream: Record<string, Stream>
  cover: Cover | null
  genres: string[]
  externalId: string | null
  shareUrl: string | null
  filePath: string | null
  genresFlat: string
  providersFlat: string
}

export type ArtistRow = {
  id: string
  name: string
}

export type AlbumRow = {
  id: string
  name: string
  artistId: string
  thumbnailUrl: string | null
  year: number | null
}
```

**Step 2: Create ID generation utilities in src/utils/generateIds.ts**

Port the logic from MediaId.ts, ArtistId.ts, AlbumId.ts as pure functions:

```typescript
import slugify from '@sindresorhus/slugify'

export function generateArtistId(artistName: string): string {
  return slugify(artistName || 'unknown-artist')
}

export function generateAlbumId(albumName: string, artistName: string): string {
  return slugify(`${artistName}-${albumName}` || 'unknown-album')
}

export function generateMediaId(opts: {
  title: string
  artistName: string
  albumName: string
  track?: number | null
  forcedId?: string | null
}): string {
  if (opts.forcedId) return opts.forcedId
  const base = `${opts.artistName}-${opts.albumName}-${opts.track || ''}-${opts.title}`
  return slugify(base)
}
```

Note: Read the actual MediaId/ArtistId/AlbumId classes first to get the exact slugification logic — the above is approximate.

**Step 3: Create hasAnyProviderOf utility in src/utils/hasAnyProviderOf.ts**

```typescript
import type { Stream } from '../types/media'

export function hasAnyProviderOf(
  stream: Record<string, Stream>,
  providers: string[]
): boolean {
  return Object.keys(stream).some(key => providers.includes(key))
}
```

**Step 4: Write tests for ID generation**

```typescript
// src/utils/generateIds.spec.ts
import { describe, it, expect } from 'vitest'
import { generateArtistId, generateAlbumId, generateMediaId } from './generateIds'

describe('generateArtistId', () => {
  it('slugifies artist name', () => {
    expect(generateArtistId('The Beatles')).toBe('the-beatles')
  })
  it('handles empty name', () => {
    expect(generateArtistId('')).toBe('unknown-artist')
  })
})

describe('generateAlbumId', () => {
  it('combines artist and album', () => {
    const id = generateAlbumId('Abbey Road', 'The Beatles')
    expect(id).toBe('the-beatles-abbey-road')
  })
})

describe('generateMediaId', () => {
  it('uses forcedId when provided', () => {
    expect(generateMediaId({ title: 'x', artistName: 'y', albumName: 'z', forcedId: 'custom' })).toBe('custom')
  })
  it('generates slug from components', () => {
    const id = generateMediaId({ title: 'Come Together', artistName: 'The Beatles', albumName: 'Abbey Road', track: 1 })
    expect(id).toContain('beatles')
    expect(id).toContain('come-together')
  })
})
```

**Step 5: Write tests for hasAnyProviderOf**

```typescript
// src/utils/hasAnyProviderOf.spec.ts
import { describe, it, expect } from 'vitest'
import { hasAnyProviderOf } from './hasAnyProviderOf'

describe('hasAnyProviderOf', () => {
  const stream = {
    subsonic: { service: 'subsonic', uris: [{ uri: 'http://...' }] },
    opfs: { service: 'opfs', uris: [{ uri: '/local/file' }] }
  }

  it('returns true when provider exists', () => {
    expect(hasAnyProviderOf(stream, ['opfs'])).toBe(true)
  })
  it('returns false when provider missing', () => {
    expect(hasAnyProviderOf(stream, ['jellyfin'])).toBe(false)
  })
  it('handles empty stream', () => {
    expect(hasAnyProviderOf({}, ['opfs'])).toBe(false)
  })
})
```

**Step 6: Run tests**

Run: `npx vitest run src/utils/generateIds.spec.ts src/utils/hasAnyProviderOf.spec.ts`
Expected: All pass

**Step 7: Commit**

```bash
git add src/types/media.ts src/utils/generateIds.ts src/utils/generateIds.spec.ts src/utils/hasAnyProviderOf.ts src/utils/hasAnyProviderOf.spec.ts
git commit -m "feat: add MediaRow types, ID generators, and hasAnyProviderOf utility"
```

---

### Task 2: Create normalizeMedia function

**Files:**
- Create: `src/utils/normalizeMedia.ts`
- Test: `src/utils/normalizeMedia.spec.ts`

**Step 1: Define RawMediaInput type and normalizeMedia function**

```typescript
// src/utils/normalizeMedia.ts
import type { MediaRow, Cover, Stream } from '../types/media'
import { generateMediaId, generateArtistId, generateAlbumId } from './generateIds'

export type DurationInput =
  | { value: number; unit: 'ms' }
  | { value: number; unit: 'seconds' }
  | { value: number; unit: 'ticks' }
  | number // treated as ms for backwards compat

export type RawMediaInput = {
  title?: string
  artistName?: string
  albumName?: string
  type?: 'audio' | 'video'
  duration?: DurationInput
  track?: number | null
  discNumber?: number | null
  stream?: Record<string, Stream>
  cover?: Cover | null
  genres?: string[] | string
  externalId?: string | null
  shareUrl?: string | null
  filePath?: string | null
  forcedId?: string | null
  year?: number | null
}

export type NormalizedMedia = {
  media: MediaRow
  artist: { id: string; name: string }
  album: { id: string; name: string; artistId: string; thumbnailUrl: string | null; year: number | null }
}

function normalizeDuration(input?: DurationInput): number {
  if (input == null) return 0
  if (typeof input === 'number') return input
  switch (input.unit) {
    case 'ms': return input.value
    case 'seconds': return input.value * 1000
    case 'ticks': return Math.floor(input.value / 10000)
  }
}

function normalizeGenres(input?: string[] | string): string[] {
  if (!input) return []
  if (typeof input === 'string') return input ? [input] : []
  return input.filter(g => g !== '')
}

export function normalizeMedia(raw: RawMediaInput): NormalizedMedia {
  const artistName = raw.artistName || 'Unknown Artist'
  const albumName = raw.albumName || 'Unknown Album'
  const title = raw.title || 'Untitled'
  const stream = raw.stream || {}
  const genres = normalizeGenres(raw.genres)

  const artistId = generateArtistId(artistName)
  const albumId = generateAlbumId(albumName, artistName)
  const mediaId = generateMediaId({
    title,
    artistName,
    albumName,
    track: raw.track,
    forcedId: raw.forcedId
  })

  const media: MediaRow = {
    id: mediaId,
    title,
    artistId,
    albumId,
    artistName,
    albumName,
    type: raw.type || 'audio',
    duration: normalizeDuration(raw.duration),
    playCount: 0,
    track: raw.track ?? null,
    discNumber: raw.discNumber ?? null,
    stream,
    cover: raw.cover || null,
    genres,
    externalId: raw.externalId ?? null,
    shareUrl: raw.shareUrl ?? null,
    filePath: raw.filePath ?? null,
    genresFlat: genres.join(','),
    providersFlat: Object.keys(stream).join(',')
  }

  return {
    media,
    artist: { id: artistId, name: artistName },
    album: {
      id: albumId,
      name: albumName,
      artistId,
      thumbnailUrl: raw.cover?.thumbnailUrl || null,
      year: raw.year ?? null
    }
  }
}
```

**Step 2: Write tests**

```typescript
// src/utils/normalizeMedia.spec.ts
import { describe, it, expect } from 'vitest'
import { normalizeMedia } from './normalizeMedia'

describe('normalizeMedia', () => {
  it('converts seconds to ms', () => {
    const result = normalizeMedia({
      title: 'Song',
      duration: { value: 180, unit: 'seconds' }
    })
    expect(result.media.duration).toBe(180000)
  })

  it('converts ticks to ms', () => {
    const result = normalizeMedia({
      title: 'Song',
      duration: { value: 1800000000, unit: 'ticks' }
    })
    expect(result.media.duration).toBe(180000)
  })

  it('passes ms through', () => {
    const result = normalizeMedia({
      title: 'Song',
      duration: { value: 5000, unit: 'ms' }
    })
    expect(result.media.duration).toBe(5000)
  })

  it('treats bare number as ms for backwards compat', () => {
    const result = normalizeMedia({
      title: 'Song',
      duration: 3000
    })
    expect(result.media.duration).toBe(3000)
  })

  it('defaults missing fields', () => {
    const result = normalizeMedia({ title: 'Song' })
    expect(result.media.artistName).toBe('Unknown Artist')
    expect(result.media.albumName).toBe('Unknown Album')
    expect(result.media.duration).toBe(0)
    expect(result.media.genres).toEqual([])
    expect(result.media.stream).toEqual({})
  })

  it('generates consistent IDs', () => {
    const a = normalizeMedia({ title: 'Song', artistName: 'Artist', albumName: 'Album' })
    const b = normalizeMedia({ title: 'Song', artistName: 'Artist', albumName: 'Album' })
    expect(a.media.id).toBe(b.media.id)
    expect(a.artist.id).toBe(b.artist.id)
    expect(a.album.id).toBe(b.album.id)
  })

  it('uses forcedId when provided', () => {
    const result = normalizeMedia({ title: 'Song', forcedId: 'custom-id' })
    expect(result.media.id).toBe('custom-id')
  })

  it('computes denormalized fields', () => {
    const result = normalizeMedia({
      title: 'Song',
      genres: ['rock', 'blues'],
      stream: { subsonic: { service: 'sub', uris: [{ uri: 'http://x' }] } }
    })
    expect(result.media.genresFlat).toBe('rock,blues')
    expect(result.media.providersFlat).toBe('subsonic')
  })

  it('filters empty genre strings', () => {
    const result = normalizeMedia({ title: 'Song', genres: ['rock', '', 'blues'] })
    expect(result.media.genres).toEqual(['rock', 'blues'])
  })
})
```

**Step 3: Run tests**

Run: `npx vitest run src/utils/normalizeMedia.spec.ts`
Expected: All pass

**Step 4: Commit**

```bash
git add src/utils/normalizeMedia.ts src/utils/normalizeMedia.spec.ts
git commit -m "feat: add normalizeMedia function with duration conversion and defaults"
```

---

### Task 3: Migrate providers to use normalizeMedia

**Files:**
- Modify: `src/providers/SubsonicApiProvider.ts`
- Modify: `src/providers/JellyfinProvider.ts`
- Modify: `src/providers/MstreamApiProvider.ts`
- Modify: `src/providers/YoutubeDlServerProvider.ts`
- Modify: `src/services/ID3Tag/ID3TagService.ts`
- Modify: `src/providers/IMusicProvider.ts`

**Step 1: Update IMusicProvider interface**

Change return types from `Promise<IMedia[]>` to `Promise<NormalizedMedia[]>`:

```typescript
import type { NormalizedMedia } from '../utils/normalizeMedia'

export default interface IMusicProvider {
  providerKey: string
  search(searchTerm: string): Promise<NormalizedMedia[]>
  getArtistSongs?(artistName: string): Promise<NormalizedMedia[]>
  getScanStatus?(): Promise<{ scanning: boolean; count: number; lastScan?: string }>
  getNewestAlbumsSince?(sinceDate: string): Promise<NormalizedMedia[]>
  getAlbumsBatch?(offset: number, size: number): Promise<{ media: NormalizedMedia[]; hasMore: boolean }>
}
```

**Step 2: Migrate SubsonicApiProvider**

Replace `new Media({...})` with `normalizeMedia({...})`. Key change — duration stays in provider's native unit:

```typescript
import { normalizeMedia } from '../utils/normalizeMedia'

// In mapSongs():
// Before: duration: song.duration * 1000
// After:  duration: { value: song.duration, unit: 'seconds' }
```

Remove `import Media from '../entities/Media'`.

**Step 3: Migrate JellyfinProvider**

```typescript
// Before: duration: Math.floor((item.RunTimeTicks || 0) / 10000)
// After:  duration: { value: item.RunTimeTicks || 0, unit: 'ticks' }
```

**Step 4: Migrate MstreamApiProvider**

No duration conversion was happening, so use `{ value: 0, unit: 'ms' }` or omit duration.

**Step 5: Migrate YoutubeDlServerProvider**

Duration was hardcoded to 0, so omit duration field (normalizeMedia defaults to 0).

**Step 6: Fix ID3TagService (the bug)**

```typescript
// Before: duration: metadata.format.duration || 0  (seconds, not converted!)
// After:  duration: { value: metadata.format.duration || 0, unit: 'seconds' }
```

**Step 7: Run existing provider tests**

Run: `npm run test`
Expected: Provider tests pass (may need minor type adjustments in test assertions)

**Step 8: Commit**

```bash
git add src/providers/ src/services/ID3Tag/ID3TagService.ts
git commit -m "refactor: migrate providers from new Media() to normalizeMedia()"
```

---

### Task 4: Update LiveStore actions and BatchedMediaCommitter

**Files:**
- Modify: `src/stores/livestore/actions/media.ts`
- Modify: `src/stores/livestore/services/BatchedMediaCommitter.ts`

**Step 1: Update BatchedMediaCommitter**

It currently receives `IMedia[]` and does its own normalization before committing. Change to accept `NormalizedMedia[]` — the normalization is already done:

- Remove the internal normalization logic (fallback defaults, ID generation)
- Accept pre-normalized data
- Just commit the media/artist/album rows directly

**Step 2: Update media actions**

The action that adds media to LiveStore should accept `NormalizedMedia[]` instead of `IMedia[]`.

**Step 3: Run tests**

Run: `npm run test`
Expected: Pass

**Step 4: Commit**

```bash
git add src/stores/livestore/
git commit -m "refactor: BatchedMediaCommitter accepts NormalizedMedia directly"
```

---

### Task 5: Update components and services that reference IMedia/entity types

**Files:**
- Modify: `src/components/SongView/index.tsx` — remove `new Media(song)`, use `hasAnyProviderOf(song.stream, ['opfs'])` directly
- Modify: `src/services/MediaFileService.ts` — use standalone `hasAnyProviderOf`
- Modify: All files with `: IMedia` type annotations (~20 files) — change to `MediaRow`
- Modify: Files with `IArtist`/`IAlbum` — change to `ArtistRow`/`AlbumRow`
- Modify: `src/test-utils/factories.ts` — return plain objects matching row types
- Modify: `src/constants/defaultMedia.ts` — return a `MediaRow` instead of `new Media(...)`

**Step 1: Fix SongView**

Remove:
```typescript
import Media from '../entities/Media'
const songObj = song ? new Media(song) : null
const isSongPinned = songObj?.hasAnyProviderOf(['opfs']) || false
```

Replace with:
```typescript
import { hasAnyProviderOf } from '../../utils/hasAnyProviderOf'
const isSongPinned = song ? hasAnyProviderOf(song.stream, ['opfs']) : false
```

**Step 2: Fix MediaFileService**

Replace entity import with utility import.

**Step 3: Rename IMedia → MediaRow across codebase**

Mechanical find-and-replace. TypeScript compiler will flag any missed ones.

**Step 4: Update test factories**

Return plain objects matching `MediaRow` shape instead of `new Media(...)`.

**Step 5: Run build + tests**

Run: `npm run build && npm run test`
Expected: Pass

**Step 6: Commit**

```bash
git add -A
git commit -m "refactor: replace IMedia with MediaRow across components and services"
```

---

### Task 6: Delete entity files

**Files:**
- Delete: `src/entities/Media.ts`
- Delete: `src/entities/Artist.ts`
- Delete: `src/entities/Album.ts`
- Delete: `src/entities/MediaId.ts`
- Delete: `src/entities/ArtistId.ts`
- Delete: `src/entities/AlbumId.ts`
- Delete: `src/entities/Media.spec.ts`
- Modify: Any remaining imports of entities

**Step 1: Delete entity files**

```bash
rm src/entities/Media.ts src/entities/Artist.ts src/entities/Album.ts
rm src/entities/MediaId.ts src/entities/ArtistId.ts src/entities/AlbumId.ts
rm src/entities/Media.spec.ts
```

**Step 2: Check for remaining entity imports**

Run: `grep -r "from.*entities/" src/ --include="*.ts" --include="*.tsx" -l`

Fix any remaining imports.

**Step 3: Verify build + tests**

Run: `npm run build && npm run test`
Expected: Pass with no entity references remaining

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete entity classes (replaced by row types + normalizeMedia)"
```

---

### Task 7: Final verification

**Step 1: Run knip**

Run: `npm run knip`
Expected: No new unused files introduced

**Step 2: Full build**

Run: `npm run build`
Expected: Success

**Step 3: Full test suite**

Run: `npm run test`
Expected: All tests pass

**Step 4: Verify the duration bug is fixed**

Check that ID3TagService now passes `{ value: ..., unit: 'seconds' }` and normalizeMedia converts it to ms.
