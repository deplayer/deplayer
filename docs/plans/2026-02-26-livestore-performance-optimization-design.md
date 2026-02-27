# LiveStore Performance Optimization Design

**Date**: 2026-02-26  
**Status**: Draft  
**Goal**: Eliminate FPS drops during provider fetches by batching LiveStore commits

## Problem Statement

When fetching media from multiple providers, each provider's results trigger a separate `store.commit()`, causing:
- Multiple reactive refreshes (5 providers = 5 refreshes)
- 19 components using `useMediaLibrary()` re-render on each refresh
- Main thread blocked during materializer SQL operations
- Visible frame drops and UI jank

## Requirements

1. **Progressive display**: Show results as each provider finishes (not all-at-once)
2. **Scale to 1000 items**: Handle large result sets without freezing
3. **Remove Redux legacy**: Drop `RECEIVE_COLLECTION` dispatch

## Design

### Approach: Throttled Batch Commits with `skipRefresh`

```
Provider A completes (200 items)
    ↓
commit({ skipRefresh: true }, mediaBulkAdded)  ← No UI refresh yet
    ↓
[100ms window starts]
    ↓
Provider B completes (150 items)  
    ↓
commit({ skipRefresh: true }, mediaBulkAdded)  ← Still no refresh
    ↓
[100ms elapsed, no new commits]
    ↓
store.manualRefresh()  ← ONE refresh for both batches
    ↓
UI updates with 350 items
```

### Key Components

#### 1. BatchedMediaCommitter Service

New service that manages throttled commits:

```typescript
// src/stores/livestore/services/BatchedMediaCommitter.ts

class BatchedMediaCommitter {
  private pendingMedia: IMedia[] = []
  private flushTimeout: number | null = null
  private store: Store | null = null
  
  private readonly THROTTLE_MS = 100  // Batch window
  private readonly MAX_BATCH_SIZE = 500  // Force flush if exceeded
  
  setStore(store: Store) {
    this.store = store
  }
  
  async add(mediaItems: IMedia[]): Promise<void> {
    this.pendingMedia.push(...mediaItems)
    
    // Force flush if batch too large (prevents memory buildup)
    if (this.pendingMedia.length >= this.MAX_BATCH_SIZE) {
      await this.flush()
      return
    }
    
    // Debounce: reset timer on each add
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout)
    }
    
    this.flushTimeout = window.setTimeout(() => {
      this.flush()
    }, this.THROTTLE_MS)
  }
  
  async flush(): Promise<void> {
    if (!this.store || this.pendingMedia.length === 0) return
    
    const mediaToCommit = [...this.pendingMedia]
    this.pendingMedia = []
    this.flushTimeout = null
    
    // Commit with skipRefresh for performance
    await this.store.commit(
      { skipRefresh: true },
      mediaEvents.mediaBulkAdded({ media: normalizeAll(mediaToCommit) })
    )
    
    // Single refresh after commit
    this.store.manualRefresh()
  }
}

export const batchedMediaCommitter = new BatchedMediaCommitter()
```

#### 2. Updated Search Saga

```typescript
// src/sagas/search/index.ts

function* performSingleProviderSearch(searchTerm: string, provider: string) {
  const searchResults = yield call(providerService.searchForProvider, searchTerm, provider)
  
  if (searchResults?.length > 0) {
    const liveStore = getLiveStoreInstance()
    if (liveStore) {
      // Use batched committer instead of direct commit
      yield call([batchedMediaCommitter, 'add'], searchResults)
    }
    // REMOVED: yield put({ type: types.RECEIVE_COLLECTION, data: searchResults })
  }
}
```

#### 3. Derived Metadata Hooks (FilterPanel optimization)

```typescript
// src/stores/livestore/hooks/useMetadata.ts

export const useAvailableGenres = () => {
  // Query only distinct genresFlat column
  const result = useQuery(
    queryDb(tables.media.select('genresFlat'))
  )
  
  return useMemo(() => {
    const genres = new Set<string>()
    result?.forEach((row: any) => {
      row.genresFlat?.split(',').forEach((g: string) => g && genres.add(g))
    })
    return Array.from(genres).sort()
  }, [result])
}

export const useAvailableProviders = () => {
  const result = useQuery(
    queryDb(tables.media.select('providersFlat'))
  )
  
  return useMemo(() => {
    const providers = new Set<string>()
    result?.forEach((row: any) => {
      row.providersFlat?.split(',').forEach((p: string) => p && providers.add(p))
    })
    return Array.from(providers).sort()
  }, [result])
}

export const useAvailableTypes = () => {
  const result = useQuery(
    queryDb(tables.media.select('type').distinct())
  )
  
  return useMemo(() => {
    return result?.map((row: any) => row.type).filter(Boolean) || []
  }, [result])
}
```

#### 4. Updated FilterPanel

```typescript
// src/components/Collection/FilterPanel.tsx

// BEFORE:
const mediaLibrary = useMediaLibrary()  // Loads ALL media
const genres = mediaLibrary.reduce(...)  // Iterates ALL media

// AFTER:
const genres = useAvailableGenres()      // Lightweight query
const providers = useAvailableProviders()
const types = useAvailableTypes()
```

## Data Flow (After)

```
Provider A completes ──┐
Provider B completes ──┼──→ BatchedMediaCommitter ──→ [100ms] ──→ commit(skipRefresh) ──→ manualRefresh()
Provider C completes ──┘                                                                       ↓
                                                                                    Single UI refresh
                                                                                               ↓
                                                                            useCollectionData updates
                                                                                               ↓
                                                                              MusicTable re-renders once
```

## Files to Modify

| File | Change |
|------|--------|
| `src/stores/livestore/services/BatchedMediaCommitter.ts` | **NEW** - Throttled commit service |
| `src/stores/livestore/hooks/useMetadata.ts` | **NEW** - Lightweight metadata hooks |
| `src/stores/livestore/hooks/index.ts` | Export new hooks |
| `src/sagas/search/index.ts` | Use BatchedMediaCommitter, remove Redux dispatch |
| `src/components/Collection/FilterPanel.tsx` | Use metadata hooks instead of useMediaLibrary |
| `src/reducers/collection.ts` | Remove `RECEIVE_COLLECTION` handling |
| `src/constants/ActionTypes.ts` | Remove `RECEIVE_COLLECTION` if unused elsewhere |

## Performance Expectations

| Metric | Before | After |
|--------|--------|-------|
| UI refreshes per search | 5 (per provider) | 1-2 (batched) |
| FilterPanel re-renders | On every media change | Only on metadata change |
| Frame drops during import | Frequent | Rare |
| Time to first result | ~same | ~same (progressive) |

## Risks & Mitigations

1. **Risk**: Batching delays could feel sluggish
   - **Mitigation**: 100ms window is imperceptible, adjustable

2. **Risk**: Large batches still block main thread
   - **Mitigation**: MAX_BATCH_SIZE=500 forces intermediate flushes

3. **Risk**: Removing RECEIVE_COLLECTION breaks something
   - **Mitigation**: Search codebase for all usages first

## Testing Plan

1. Search with 3+ providers enabled, verify single batch commit
2. Search returning 1000+ items, verify no frame drops
3. Verify FilterPanel updates correctly with new hooks
4. Verify no regressions in collection display
