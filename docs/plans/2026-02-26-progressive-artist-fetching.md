# Progressive Artist Fetching Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically fetch all songs for an artist from providers when visiting their page.

**Architecture:** Add `getArtistSongs(artistName)` method to provider interface, implement in each provider (Subsonic, Jellyfin, Mstream), create saga to call it on artist page visit, merge results into LiveStore.

**Tech Stack:** TypeScript, Redux-Saga, LiveStore, Axios, Subsonic API, Jellyfin SDK

---

## Task 1: Add Action Type

**Files:**
- Modify: `src/constants/ActionTypes.ts`

**Step 1: Add the new action type**

Add after the existing artist actions (around line 12):

```typescript
export const FETCH_ARTIST_SONGS = "FETCH_ARTIST_SONGS";
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: No errors

**Step 3: Commit**

```bash
git add src/constants/ActionTypes.ts
git commit -m "feat: add FETCH_ARTIST_SONGS action type"
```

---

## Task 2: Extend Provider Interface

**Files:**
- Modify: `src/providers/IMusicProvider.ts`

**Step 1: Add the optional method to interface**

```typescript
import { IMedia } from '../entities/Media'

export interface IMusicProvider {
  providerKey: string;
  search(searchTerm: string): Promise<IMedia[]>;
  fullSync?(): Promise<IMedia[]>;
  getRecentMedia?(): Promise<IMedia[]>;
  getArtistSongs?(artistName: string): Promise<IMedia[]>;
}
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: No errors

**Step 3: Commit**

```bash
git add src/providers/IMusicProvider.ts
git commit -m "feat: add getArtistSongs to IMusicProvider interface"
```

---

## Task 3: Implement SubsonicApiProvider.getArtistSongs

**Files:**
- Modify: `src/providers/SubsonicApiProvider.ts`
- Create: `src/providers/SubsonicApiProvider.getArtistSongs.spec.ts`

**Step 1: Write the failing test**

Create `src/providers/SubsonicApiProvider.getArtistSongs.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import SubsonicApiProvider from './SubsonicApiProvider'

vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('SubsonicApiProvider.getArtistSongs', () => {
  let provider: SubsonicApiProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new SubsonicApiProvider({
      baseUrl: 'http://localhost:4533',
      user: 'admin',
      password: 'admin'
    }, 'navidrome')
  })

  it('should return songs for an artist', async () => {
    // Mock search3 to find artist
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        'subsonic-response': {
          searchResult3: {
            artist: [{ id: 'ar-123', name: 'Test Artist' }]
          }
        }
      }
    })

    // Mock getArtist to get albums
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        'subsonic-response': {
          artist: {
            id: 'ar-123',
            name: 'Test Artist',
            album: [
              { id: 'al-1', name: 'Album 1', year: 2020 },
              { id: 'al-2', name: 'Album 2', year: 2021 }
            ]
          }
        }
      }
    })

    // Mock getAlbum for each album
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        'subsonic-response': {
          album: {
            id: 'al-1',
            name: 'Album 1',
            year: 2020,
            song: [
              { id: 's1', title: 'Song 1', artist: 'Test Artist', album: 'Album 1', duration: 180, track: 1, path: '/music/song1.mp3', coverArt: 'cov1', genres: [] }
            ]
          }
        }
      }
    })

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        'subsonic-response': {
          album: {
            id: 'al-2',
            name: 'Album 2',
            year: 2021,
            song: [
              { id: 's2', title: 'Song 2', artist: 'Test Artist', album: 'Album 2', duration: 200, track: 1, path: '/music/song2.mp3', coverArt: 'cov2', genres: [] }
            ]
          }
        }
      }
    })

    const songs = await provider.getArtistSongs('Test Artist')

    expect(songs).toHaveLength(2)
    expect(songs[0].title).toBe('Song 1')
    expect(songs[1].title).toBe('Song 2')
  })

  it('should return empty array when artist not found', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        'subsonic-response': {
          searchResult3: {
            artist: []
          }
        }
      }
    })

    const songs = await provider.getArtistSongs('Unknown Artist')

    expect(songs).toEqual([])
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/providers/SubsonicApiProvider.getArtistSongs.spec.ts`
Expected: FAIL with "getArtistSongs is not a function" or similar

**Step 3: Implement getArtistSongs**

Add to `src/providers/SubsonicApiProvider.ts` before the closing brace:

```typescript
  async getArtistSongs(artistName: string): Promise<Array<IMedia>> {
    try {
      // 1. Search for artist by name
      const searchResult = await axios.get(
        `${this.searchUrl}&query=${encodeURIComponent(artistName)}`
      );
      
      const artists = searchResult.data["subsonic-response"].searchResult3?.artist || [];
      
      // Find exact or closest match
      const artist = artists.find(
        (a: { name: string }) => a.name.toLowerCase() === artistName.toLowerCase()
      ) || artists[0];
      
      if (!artist) {
        logger.debug(`Artist not found: ${artistName}`);
        return [];
      }

      // 2. Get artist details with albums
      const artistResult = await axios.get(
        `${this.baseUrl}/rest/getArtist.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.11.0&f=json&id=${artist.id}`
      );
      
      const albums = artistResult.data["subsonic-response"].artist?.album || [];
      
      if (albums.length === 0) {
        logger.debug(`No albums found for artist: ${artistName}`);
        return [];
      }

      // 3. Get songs from each album
      const allSongs: IMedia[] = [];
      
      for (const album of albums) {
        try {
          const albumResult = await axios.get(
            `${this.baseUrl}/rest/getAlbum.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.11.0&f=json&id=${album.id}`
          );
          
          const songs = albumResult.data["subsonic-response"].album?.song || [];
          const mappedSongs = this.mapSongs(songs, [album]);
          allSongs.push(...mappedSongs);
        } catch (error) {
          logger.error(`Error fetching album ${album.id}:`, error);
          // Continue with next album
        }
      }

      logger.debug(`Found ${allSongs.length} songs for artist: ${artistName}`);
      return allSongs;
    } catch (error) {
      logger.error(`Error fetching artist songs for ${artistName}:`, error);
      return [];
    }
  }
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/providers/SubsonicApiProvider.getArtistSongs.spec.ts`
Expected: PASS

**Step 5: Run all provider tests**

Run: `npm test -- src/providers/`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/providers/SubsonicApiProvider.ts src/providers/SubsonicApiProvider.getArtistSongs.spec.ts
git commit -m "feat: implement getArtistSongs for SubsonicApiProvider"
```

---

## Task 4: Implement JellyfinProvider.getArtistSongs

**Files:**
- Modify: `src/providers/JellyfinProvider.ts`

**Step 1: Implement getArtistSongs**

Add to `src/providers/JellyfinProvider.ts` before the closing brace:

```typescript
  async getArtistSongs(artistName: string): Promise<Array<Media>> {
    await this.initialize();

    if (!this.userId) {
      throw new Error("User ID not found");
    }

    try {
      // Search for all audio items by this artist
      const results = await getItemsApi(this.api).getItems({
        userId: this.userId,
        searchTerm: artistName,
        includeItemTypes: ["Audio"],
        recursive: true,
        fields: [
          ItemFields.Path,
          ItemFields.Genres,
          ItemFields.Studios,
          ItemFields.ParentId,
        ] as ItemFields[],
        limit: 10000,
      });

      const items = results.data.Items || [];
      
      // Filter to only include songs where artist matches
      const artistItems = items.filter((item: any) => {
        const itemArtist = item.AlbumArtist || item.Artists?.[0] || '';
        return itemArtist.toLowerCase() === artistName.toLowerCase();
      });

      logger.debug(`Found ${artistItems.length} songs for artist: ${artistName}`);
      return this.mapSongs(artistItems);
    } catch (error) {
      logger.error(`Error fetching artist songs for ${artistName}:`, error);
      return [];
    }
  }
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: No errors

**Step 3: Commit**

```bash
git add src/providers/JellyfinProvider.ts
git commit -m "feat: implement getArtistSongs for JellyfinProvider"
```

---

## Task 5: Implement MstreamApiProvider.getArtistSongs

**Files:**
- Modify: `src/providers/MstreamApiProvider.ts`

**Step 1: Implement getArtistSongs (fallback to search)**

Add to `src/providers/MstreamApiProvider.ts` before the closing brace:

```typescript
  async getArtistSongs(artistName: string): Promise<Array<IMedia>> {
    // Mstream doesn't have artist-specific endpoint, use search
    return this.search(artistName);
  }
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: No errors

**Step 3: Commit**

```bash
git add src/providers/MstreamApiProvider.ts
git commit -m "feat: implement getArtistSongs for MstreamApiProvider"
```

---

## Task 6: Create Artist Songs Saga

**Files:**
- Modify: `src/sagas/artist/index.ts`

**Step 1: Add the new saga function**

Add imports at the top:

```typescript
import ProvidersService from '../../services/ProvidersService'
import { addMediaBulkAction } from '../../stores/livestore/actions/media'
```

Add the new saga function after `loadMoreArtistSongsFromProvider`:

```typescript
function* fetchArtistSongsFromProvider(action: { type: string; artist: { name: string } }): Generator<any, void, any> {
  const artistName = action.artist?.name
  if (!artistName) {
    logger.debug('No artist name provided')
    return
  }

  try {
    const settings = yield call(getSettingsFromLiveStore)
    if (!settings?.providers) {
      logger.debug('No providers configured')
      return
    }

    const providersService = new ProvidersService(settings)
    const liveStore = getLiveStoreInstance()
    
    if (!liveStore) {
      logger.error('LiveStore not available')
      return
    }

    // Call each enabled provider that supports getArtistSongs
    for (const provider of Object.values(providersService.providers) as any[]) {
      if (provider.getArtistSongs) {
        try {
          logger.debug(`Fetching songs for ${artistName} from ${provider.providerKey}`)
          const songs = yield call([provider, provider.getArtistSongs], artistName)
          
          if (songs?.length > 0) {
            logger.debug(`Found ${songs.length} songs, merging into LiveStore`)
            yield call(addMediaBulkAction, liveStore, songs)
          }
        } catch (error) {
          // Silent failure - just log and continue to next provider
          logger.debug(`Failed to fetch from ${provider.providerKey}:`, error)
        }
      }
    }
  } catch (error) {
    logger.error('Error in fetchArtistSongsFromProvider:', error)
  }
}
```

**Step 2: Register the saga**

Update the `artistSaga` function to include the new saga:

```typescript
function* artistSaga(): any {
  yield takeLatest(types.LOAD_ARTIST, loadMoreArtistSongsFromProvider)
  yield takeLatest(types.FETCH_ARTIST_SONGS, fetchArtistSongsFromProvider)
  yield takeLatest(types.FETCH_LYRICS, fetchSongMetadata)
}
```

**Step 3: Verify lint passes**

Run: `npm run lint`
Expected: No errors

**Step 4: Commit**

```bash
git add src/sagas/artist/index.ts
git commit -m "feat: add fetchArtistSongsFromProvider saga"
```

---

## Task 7: Update ArtistView Component

**Files:**
- Modify: `src/components/ArtistView/index.tsx`

**Step 1: Add FETCH_ARTIST_SONGS dispatch**

Update the useEffect in `ArtistView`:

```typescript
  React.useEffect(() => {
    if (artist && artist.name) {
      dispatch({
        type: types.LOAD_ARTIST,
        artist: artist
      })

      // Fetch songs from all providers
      dispatch({
        type: types.FETCH_ARTIST_SONGS,
        artist: artist
      })

      dispatch({
        type: types.SET_BACKGROUND_IMAGE,
        backgroundImage: extractBackground()
      })
    }
  }, [artist?.name, dispatch])
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/ArtistView/index.tsx
git commit -m "feat: dispatch FETCH_ARTIST_SONGS on artist page visit"
```

---

## Task 8: Integration Test & Manual Verification

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 3: Start dev server**

Run: `npm run dev`

**Step 4: Manual test with Navidrome**

1. Open app in browser
2. Navigate to an artist page (one with incomplete data)
3. Observe: Existing songs show immediately
4. Observe: After 1-3 seconds, additional songs appear
5. Verify: All albums/songs from Navidrome now visible

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: progressive artist fetching from providers

- Add getArtistSongs() to IMusicProvider interface
- Implement for Subsonic, Jellyfin, and Mstream providers
- Create FETCH_ARTIST_SONGS action and saga
- Dispatch on artist page visit
- Seamlessly merge results into LiveStore"
```

---

## Summary

| Task | Description | Estimated Time |
|------|-------------|----------------|
| 1 | Add action type | 2 min |
| 2 | Extend interface | 3 min |
| 3 | Subsonic implementation + tests | 20 min |
| 4 | Jellyfin implementation | 10 min |
| 5 | Mstream implementation | 5 min |
| 6 | Create saga | 15 min |
| 7 | Update component | 5 min |
| 8 | Integration test | 10 min |

**Total: ~70 minutes**
