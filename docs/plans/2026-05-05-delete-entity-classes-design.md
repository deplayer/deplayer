# Delete Entity Classes

## Goal

Remove Media/Artist/Album entity classes. LiveStore row types become the canonical domain types. One `normalizeMedia()` function replaces scattered provider normalization.

## What gets deleted

- `src/entities/Media.ts` (class + IMedia interface)
- `src/entities/Artist.ts` (class + IArtist interface)
- `src/entities/Album.ts` (class + IAlbum interface)
- `src/entities/MediaId.ts`
- `src/entities/ArtistId.ts`
- `src/entities/AlbumId.ts`

## What replaces them

1. **Row types from LiveStore schema** — `MediaRow`, `ArtistRow`, `AlbumRow` exported from a types file derived from the schema.

2. **`normalizeMedia(raw: RawMediaInput): NormalizedMedia`** — single function handling:
   - Duration conversion (seconds/ticks → ms)
   - Fallback defaults
   - ID generation (pure functions: `generateMediaId`, `generateArtistId`, `generateAlbumId`)
   - Genre normalization
   - Denormalized fields (genresFlat, providersFlat, artistName, albumName)

3. **`hasAnyProviderOf(stream, providers[]): boolean`** — standalone utility.

## Data flow

```
Provider API → normalizeMedia(raw) → LiveStore.commit() → query → component
```

## Fixes included

- ID3Tag duration bug (seconds passed without ms conversion)
- SongView re-instantiation hack removed
