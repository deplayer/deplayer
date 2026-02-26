# Progressive Artist Fetching Design

**Date:** 2026-02-26  
**Status:** Approved  
**Author:** AI Assistant + genar

## Problem Statement

Artist pages show incomplete data because songs are only loaded from the initial "recent albums" sync. The previous behavior (fetching more songs when visiting an artist page) was inconsistent and relied on a now-disabled search saga.

Users experience:
- Visiting an artist and seeing only 2 of 10 albums
- Inconsistent behavior: sometimes more songs appear, sometimes they don't
- No clear pattern to when fetching works

## Requirements

| Requirement | Decision |
|-------------|----------|
| Trigger | Automatic on artist page visit |
| Scope | All providers (Subsonic, Jellyfin, Mstream) |
| UX | Show existing data immediately, seamlessly add more as they load |
| Errors | Silent failure (no error UI) |
| Caching | Always re-fetch for freshness |

## Solution: Provider Interface Extension

Add `getArtistSongs(artistName: string)` to the `IMusicProvider` interface. Each provider implements it using their best available API.

### Why This Approach

- Clean abstraction matching existing provider pattern (`search`, `fullSync`, `getRecentMedia`)
- Each provider uses optimal API (Subsonic: `getArtist`, Jellyfin: filter by artist)
- Easy to test each provider independently
- Saga stays simple, provider handles complexity

### Alternatives Considered

1. **Search-based fetching** - Re-enable search saga, use `provider.search(artistName)`
   - Rejected: Returns mixed results, less precise than dedicated endpoints

2. **Direct saga with provider detection** - Saga detects provider type, calls specific API
   - Rejected: Messy, tightly coupled, doesn't scale

## Technical Design

### Provider Interface

```typescript
// src/providers/IMusicProvider.ts
export interface IMusicProvider {
  providerKey: string;
  search(searchTerm: string): Promise<IMedia[]>;
  fullSync?(): Promise<IMedia[]>;
  getRecentMedia?(): Promise<IMedia[]>;
  
  // NEW: Fetch all songs for an artist by name
  getArtistSongs?(artistName: string): Promise<IMedia[]>;
}
```

**Why by name instead of ID:**
- LiveStore artists don't store provider-specific IDs
- Artist names are the common denominator across providers
- Providers can internally resolve name → ID if needed

### Provider Implementations

#### SubsonicApiProvider (Navidrome)

```typescript
async getArtistSongs(artistName: string): Promise<IMedia[]> {
  // 1. Search for artist by name using search3
  // 2. Get artist ID from search results
  // 3. Call getArtist(id) to get all albums
  // 4. For each album, call getAlbum(id) to get songs
  // 5. Return all mapped songs
}
```

Uses: `search3` → `getArtist` → `getAlbum`

#### JellyfinProvider

```typescript
async getArtistSongs(artistName: string): Promise<IMedia[]> {
  // 1. Search for artist items by name
  // 2. Filter items by ArtistIds or AlbumArtistIds
  // 3. Return all mapped songs
}
```

Uses: `getItems` with `ArtistIds` filter

#### MstreamApiProvider

```typescript
async getArtistSongs(artistName: string): Promise<IMedia[]> {
  // Mstream doesn't have artist-specific endpoint
  // Fall back to search by artist name
  return this.search(artistName);
}
```

Uses: Existing `search` as fallback

### Action Type

```typescript
// src/constants/ActionTypes.ts
export const FETCH_ARTIST_SONGS = "FETCH_ARTIST_SONGS";
```

### Artist Saga

```typescript
// src/sagas/artist/index.ts

function* fetchArtistSongsFromProvider(action: { artist: { name: string } }): Generator {
  const settings = yield call(getSettingsFromLiveStore);
  const providersService = new ProvidersService(settings);
  const liveStore = getLiveStoreInstance();

  // Call each enabled provider that supports getArtistSongs
  for (const provider of Object.values(providersService.providers)) {
    if (provider.getArtistSongs) {
      try {
        const songs = yield call([provider, provider.getArtistSongs], action.artist.name);
        if (songs?.length > 0) {
          // Merge into LiveStore (addMediaBulkAction handles deduplication)
          yield call(addMediaBulkAction, liveStore, songs);
        }
      } catch (error) {
        // Silent failure - just log and continue
        logger.debug('Failed to fetch artist songs:', error);
      }
    }
  }
}

function* artistSaga(): Generator {
  yield takeLatest(types.LOAD_ARTIST, loadMoreArtistSongsFromProvider);
  yield takeLatest(types.FETCH_ARTIST_SONGS, fetchArtistSongsFromProvider); // NEW
  yield takeLatest(types.FETCH_LYRICS, fetchSongMetadata);
}
```

### Component Changes

```typescript
// src/components/ArtistView/index.tsx

React.useEffect(() => {
  if (artist?.name) {
    // Existing: fetch metadata from MusicBrainz
    dispatch({ type: types.LOAD_ARTIST, artist })
    
    // NEW: fetch songs from providers
    dispatch({ type: types.FETCH_ARTIST_SONGS, artist })
    
    dispatch({ type: types.SET_BACKGROUND_IMAGE, backgroundImage: extractBackground() })
  }
}, [artist?.name, dispatch])
```

### Data Flow

```
User visits /artist/:id
       ↓
ArtistView renders (shows LiveStore data immediately)
       ↓
useEffect dispatches FETCH_ARTIST_SONGS
       ↓
Saga calls provider.getArtistSongs(artistName)
       ↓
Results merged into LiveStore
       ↓
LiveStore hooks auto-update UI (reactive)
```

## Files Affected

| File | Change |
|------|--------|
| `src/providers/IMusicProvider.ts` | Add `getArtistSongs?` method |
| `src/providers/SubsonicApiProvider.ts` | Implement `getArtistSongs` |
| `src/providers/JellyfinProvider.ts` | Implement `getArtistSongs` |
| `src/providers/MstreamApiProvider.ts` | Implement `getArtistSongs` (search fallback) |
| `src/constants/ActionTypes.ts` | Add `FETCH_ARTIST_SONGS` |
| `src/sagas/artist/index.ts` | Add `fetchArtistSongsFromProvider` saga |
| `src/components/ArtistView/index.tsx` | Dispatch `FETCH_ARTIST_SONGS` |

## Out of Scope (YAGNI)

- ❌ No caching/TTL logic (always re-fetch)
- ❌ No loading indicators (show existing data immediately)
- ❌ No error UI (silent failure)
- ❌ No background sync queue (on-demand only)
- ❌ No artist ID mapping table (use name matching)

## Testing Strategy

- Unit tests for each provider's `getArtistSongs`
- Integration test for saga flow
- Manual test with Navidrome
