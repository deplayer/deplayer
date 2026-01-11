# LiveStore Migration Design

**Date**: 2026-01-09  
**Status**: ✅ Phase 4 In Progress - Queue & Settings Migrated  
**Migration Strategy**: Clean Break (Option 2)  
**Timeline**: 6 weeks  
**Last Updated**: 2026-01-11

---

## 🚀 Migration Progress

### ✅ Completed Domains

#### 1. Queue Domain (2026-01-11)
- ✅ LiveStore schema, actions, hooks created
- ✅ All components migrated to useQueue() hook
- ✅ Redux queue reducer/saga removed from root
- ✅ Type stubs kept for backward compatibility
- **Files migrated**: 9 files
  - `useLanguage.ts`, `sw.ts`, `ContextMenuContainer.tsx`
  - `PlayerContainer.tsx`, `SongContainer.tsx`
  - `ContextualMenu.tsx`, `SaveQueueButton.tsx`
  - `ClearQueueButton.tsx`, `SongView/index.tsx`
- **Commits**: `6b2ef5f5`, `97f32c15`

#### 2. Settings Domain (2026-01-11)
- ✅ LiveStore schema, actions, hooks created
- ✅ All components migrated to useSettings() hook
- ✅ Redux settings reducer/saga removed from root
- ✅ Type stubs kept for backward compatibility
- **Files migrated**: Included with queue migration
- **Status**: Runtime errors fixed, app starts successfully

#### 3. Favorites Domain (Prior to 2026-01-11)
- ✅ Migrated to LiveStore
- ✅ Redux code removed

#### 4. Lyrics Domain (Prior to 2026-01-11)
- ✅ Migrated to LiveStore
- ✅ Redux code removed

#### 5. Playlists Domain (Prior to 2026-01-11)
- ✅ Migrated to LiveStore
- ✅ Redux infrastructure removed
- **Commit**: `74e3d1f3`

### 🔄 In Progress Domains

*None currently - ready for next domain*

### ⏳ Remaining Domains

#### 6. Search Domain
- ⏭️ **SKIPPED** - Keeping in Redux
- **Reason**: Tightly coupled to saga/SearchService/CollectionService/ProvidersService
- **Decision**: Search works well in current Redux/Saga architecture. Migration would require significant refactoring of search logic without clear benefits
- **Status**: Will remain in Redux for now, can revisit after Collection migration
- **Date**: 2026-01-11

#### 7. Media Collection Domain
- ❌ Not started
- **Complexity**: High (most complex)
- **Estimated effort**: 3-5 days
- **Note**: Includes normalization of artist/album data
- **Priority**: HIGH - This is the next target

#### 8. P2P Domain (if used)
- ❌ Not started
- **Complexity**: Medium
- **Estimated effort**: 1-2 days

### 📊 Overall Progress

| Domain | Status | Components | Redux Removed | Tests |
|--------|--------|------------|---------------|-------|
| Queue | ✅ Complete | 9 files | ✅ Yes | ⏳ Pending |
| Settings | ✅ Complete | Shared with queue | ✅ Yes | ⏳ Pending |
| Favorites | ✅ Complete | Multiple | ✅ Yes | ⏳ Pending |
| Lyrics | ✅ Complete | Multiple | ✅ Yes | ⏳ Pending |
| Playlists | ✅ Complete | Multiple | ✅ Yes | ⏳ Pending |
| Search | ⏭️ Skipped | Keeping in Redux | ❌ No | N/A |
| Collection | ⏳ **NEXT** | TBD | ❌ No | ❌ No |
| P2P | ⏳ Pending | TBD | ❌ No | ❌ No |

**Completion**: ~62% (5/8 domains complete, 1 skipped)
**Next Target**: Collection (most complex, highest impact)

---

## Executive Summary

This document outlines the complete migration from **PGlite + ElectricSQL + Redux + Redux Sagas** to **LiveStore** with React Context for ephemeral UI state.

### Current Pain Points (All 6 Selected)
1. Performance bottlenecks during large collection operations
2. Complex state synchronization between database and Redux
3. Saga complexity and side effect management
4. ElectricSQL sync reliability or setup complexity
5. Reactivity limitations - components don't update efficiently
6. Developer experience - too much boilerplate

### Migration Goals
- Eliminate Redux/Saga complexity
- Improve performance with large collections (10k+ tracks)
- Achieve automatic reactivity (no manual dispatch cycles)
- Reduce boilerplate by ~90%
- Normalize schema (fix artist/album denormalization)
- Maintain all current features
- Defer sync to Phase 2 (after local-first is stable)

---

## Architecture Overview

### Current Architecture
```
Database Layer → Adapter → Service → Saga → Action → Reducer → Selector → Component
```

**Layers**: ~7 layers of abstraction  
**Boilerplate**: ~50 lines per feature  
**State Management**: Manual synchronization between database and Redux

### New Architecture
```
LiveStore (Events + Materialized State) → React Hooks → Component
```

**Layers**: 2 layers  
**Boilerplate**: ~5 lines per feature  
**State Management**: Automatic reactivity via LiveStore queries

### What Gets Eliminated
- ❌ **Redux** - All reducers, actions, selectors, store configuration
- ❌ **Redux Sagas** - All sagas, workers, watchers (~15 saga files)
- ❌ **Adapter Layer** - PgliteAdapter, IAdapter interface, DummyAdapter
- ❌ **Service Layer** - CollectionService, PlaylistService, QueueService, etc.
- ❌ **PGlite + Drizzle** - Database infrastructure
- ❌ **ElectricSQL Sync** - Bidirectional sync system (redesign in Phase 2)

### What Gets Added
- ✅ **LiveStore Core** - `@livestore/livestore`
- ✅ **LiveStore React** - `@livestore/react`
- ✅ **LiveStore Web Adapter** - `@livestore/adapter-web`
- ✅ **Event Definitions** - Domain command events
- ✅ **Materialized Views** - SQLite views (replace reducers)
- ✅ **React Context** - For ephemeral UI state (playback, volume, theme)

---

## State Architecture

### LiveStore Handles (Persistent, Synced)
- Media library (tracks, albums, artists)
- Playlists and smart playlists
- Queue state
- Favorites
- Lyrics
- Settings
- P2P rooms and peers

### React Context Handles (Ephemeral, Local-Only)
- Current playback state (playing/paused, current time)
- Volume level
- UI theme (dark/light)
- Modal open/close states
- Form input states

### Key Architectural Benefits

1. **Automatic Reactivity**: Components subscribe to LiveStore queries → auto re-render when data changes
2. **No Boilerplate**: Direct `store.query()` vs action → saga → reducer → selector chain
3. **Single Source of Truth**: LiveStore events = only writes, materialized views = only reads
4. **Performance**: SQLite indices + reactive queries + Web Worker offload
5. **Developer Experience**: Write events, define views, use hooks → done

---

## Schema & Event Design

### Normalized Schema (Materialized Views)

#### Artist Table (NEW - normalized from media.artist JSON)
```sql
CREATE VIEW artists AS
SELECT 
  id,
  name,
  bio,
  country,
  life_span,
  relations,
  created_at,
  updated_at
FROM (
  -- Derived from ArtistAdded, ArtistUpdated events
)
```

#### Album Table (NEW - normalized from media.album JSON)
```sql
CREATE VIEW albums AS
SELECT
  id,
  title,
  artist_id,  -- FK to artists
  year,
  cover_art_url,
  created_at,
  updated_at
FROM (
  -- Derived from AlbumAdded events
)
```

#### Media Table (Refactored - references normalized entities)
```sql
CREATE VIEW media AS
SELECT
  id,
  title,
  artist_id,      -- FK to artists (was JSON)
  album_id,       -- FK to albums (was JSON)
  type,           -- audio/video
  duration,
  play_count,
  track_number,
  disc_number,
  stream_url,     -- was stream JSON
  cover_url,      -- was cover JSON
  genres,         -- JSON array (keep as-is)
  created_at,
  updated_at
FROM (
  -- Derived from MediaAdded, MediaUpdated, MediaPlayed events
)
```

#### Other Tables (mostly unchanged structure)
- `playlists` - name, track_ids, shuffle, repeat, current_playing
- `smart_playlists` - name, filters (JSON)
- `queue` - track_ids, random_track_ids, current_playing, shuffle, repeat
- `favorites` - media_id, created_at
- `media_lyrics` - media_id, lyrics_text
- `settings` - settings blob (JSON)
- `rooms` - P2P room metadata
- `peers` - P2P peer data

### Event Definitions (Domain Commands)

See full event definitions in the complete document for:
- Media Events (MediaAdded, MediaUpdated, MediaPlayed, MediaBulkAdded, MediaBulkRemoved)
- Artist Events (ArtistAdded, ArtistUpdated)
- Album Events (AlbumAdded)
- Playlist Events (PlaylistCreated, PlaylistTrackAdded, PlaylistTrackRemoved, PlaylistReordered)
- Queue Events (QueueUpdated, QueueTrackAdded, QueueCleared)
- Favorites Events (MediaFavorited, MediaUnfavorited)
- Settings Events (SettingsUpdated)
- Lyrics Events (LyricsAdded, LyricsUpdated)

### Full-Text Search Strategy

**Approach**: SQLite FTS5

```sql
CREATE VIRTUAL TABLE media_fts USING fts5(
  title,
  artist_name,
  album_title,
  content='media',
  content_rowid='id'
);
```

---

## Implementation Plan

### Phase 1: Foundation Setup (Week 1)

**Goal**: Get LiveStore running

**Tasks**:
1. Create feature branch: `feat/livestore-migration`
2. Install dependencies:
   ```bash
   npm install @livestore/livestore @livestore/react @livestore/adapter-web
   npm install --save-dev @livestore/devtools-vite
   ```
3. Create directory structure:
   - `src/stores/livestore/store.ts`
   - `src/stores/livestore/schema.ts`
   - `src/stores/livestore/test-utils.ts`
   - `src/stores/livestore/events/`
   - `src/stores/livestore/materializers/`
4. Add LiveStoreProvider to App.tsx
5. Verify initialization

**Success Criteria**:
- ✅ App runs (existing Redux still works)
- ✅ LiveStore initializes
- ✅ Devtools accessible
- ✅ Build passes

---

### Phase 2: Schema & Events (Week 2)

**Goal**: Define all events and materialized views

**Tasks**:
1. Define event types in `src/stores/livestore/events/`
2. Create materializers in `src/stores/livestore/materializers/`
3. Set up FTS5 search
4. Write unit tests

**Success Criteria**:
- ✅ All events compile
- ✅ Materializers work
- ✅ Tests pass
- ✅ FTS5 search works

---

### Phase 3: Context Layer (Week 3 - Part 1)

**Goal**: Replace Redux for ephemeral UI state

**Tasks**:
1. Create contexts:
   - `src/contexts/PlaybackContext.tsx`
   - `src/contexts/ThemeContext.tsx`
   - `src/contexts/UIContext.tsx`
2. Migrate components to contexts
3. Remove Redux UI slices

**Success Criteria**:
- ✅ Playback/theme/UI work with Context
- ✅ Redux UI state removed
- ✅ Tests pass

---

### Phase 4: Component Migration (Week 3-4)

**Goal**: Migrate all components from Redux to LiveStore

**Migration Order** (simplest → complex):
1. ✅ Settings - **COMPLETE** (2026-01-11)
2. ✅ Favorites - **COMPLETE** 
3. ✅ Lyrics - **COMPLETE**
4. ✅ Playlists - **COMPLETE**
5. ✅ Queue - **COMPLETE** (2026-01-11)
6. ⏭️ Search - **SKIPPED** (keeping in Redux, too coupled to saga/services)
7. ⏳ **Media Collection (NEXT)** - Most complex, highest impact
8. ⏳ P2P (if used) - **AFTER COLLECTION**

**Pattern**:
```typescript
// Create hook
export const useMedia = (filters?: MediaFilters) => {
  return useQuery({
    sql: buildMediaQuery(filters),
    args: buildQueryArgs(filters)
  })
}

// Update component
const { data: media } = useMedia(filters)

// Remove Redux slice and saga
```

**Success Criteria Per Domain**:
- ✅ Components use LiveStore
- ✅ Redux code removed
- ✅ Service code removed
- ✅ Tests pass

**Progress**:
- ✅ 5 of 8 domains complete (62%)
- ✅ Queue & Settings: All runtime errors fixed, app starts successfully
- ⏳ Next: Search domain migration

---

### Phase 5: Cleanup & Removal (Week 5)

**Goal**: Remove all legacy code

**Tasks**:
1. Delete Redux infrastructure (`src/reducers/`, `src/sagas/`, `src/store/`)
2. Delete database layer (`src/services/database/`)
3. Delete service layer (`src/services/*.ts`)
4. Delete sync system (`src/services/sync/`)
5. Remove dependencies:
   ```bash
   npm uninstall redux redux-saga @reduxjs/toolkit react-redux
   npm uninstall @electric-sql/pglite @electric-sql/pglite-sync
   npm uninstall drizzle-orm drizzle-kit
   ```
6. Run `npm run knip` and `npm run roomba`

**Success Criteria**:
- ✅ All legacy code deleted
- ✅ Dependencies cleaned
- ✅ Build passes
- ✅ Tests pass
- ✅ No dead code

---

### Phase 6: Performance & Polish (Week 6)

**Goal**: Ensure performance meets targets

**Tasks**:
1. Performance benchmarks (10k+ items)
2. Add SQLite indices
3. Component optimization (React.memo, etc.)
4. Error handling (boundaries, offline, messages)
5. Developer experience (docs, comments)
6. Final testing (manual checklist, cross-browser)

**Success Criteria**:
- ✅ Performance >= baseline
- ✅ All features work
- ✅ Good error handling
- ✅ Documentation updated
- ✅ Ready for merge

---

## File Structure After Migration

```
src/
├── stores/livestore/          # LiveStore setup
│   ├── store.ts
│   ├── schema.ts
│   ├── test-utils.ts
│   ├── events/                # Event definitions
│   └── materializers/         # SQLite views
├── contexts/                  # React contexts
│   ├── PlaybackContext.tsx
│   ├── ThemeContext.tsx
│   └── UIContext.tsx
├── hooks/                     # Custom LiveStore hooks
│   ├── useMedia.ts
│   ├── usePlaylists.ts
│   └── ...
└── components/                # Components using hooks

# Deleted:
├── ❌ reducers/
├── ❌ sagas/
├── ❌ store/
├── ❌ services/database/
├── ❌ services/sync/
└── ❌ services/*.ts
```

**Estimated**: ~40-50% fewer files (150 → 80)

---

## Risk Mitigation

### Risk 1: Performance Regression
**Mitigation**: Benchmark tests, performance budget (<50ms queries), continuous monitoring

### Risk 2: Missing Functionality
**Mitigation**: Feature parity checklist, user journey tests

### Risk 3: Branch Goes Stale
**Mitigation**: Time-boxed (6 weeks), small increments, regular rebases

### Risk 4: LiveStore Bugs
**Mitigation**: Early POC, escape hatch (keep PGlite deps), community support, fallback to PGlite+Zustand

### Risk 5: Sync Complexity
**Mitigation**: Defer to Phase 2, design sync-ready schema, LiveStore has built-in sync

---

## Rollback Plan

**If blocked:**

- **Option A**: Pause and fix (1-2 weeks)
- **Option B**: Pivot to PGlite + Zustand (2-3 weeks)
- **Option C**: Abandon and revert (immediate)

---

## Timeline Summary

| Week | Phase | Focus |
|------|-------|-------|
| 1 | Foundation | LiveStore setup |
| 2 | Schema & Events | Define events + views |
| 3 | Contexts + Components | Start migration |
| 4 | Component Migration | Complete migration |
| 5 | Cleanup | Remove legacy |
| 6 | Performance & Polish | Optimize + test |

**Total**: 6 weeks with buffer

---

## Dependencies

### Add
```json
{
  "@livestore/livestore": "^0.3.1",
  "@livestore/react": "^0.3.1",
  "@livestore/adapter-web": "^0.3.1",
  "@livestore/devtools-vite": "^0.3.1"
}
```

### Remove
```json
{
  "redux": "REMOVE",
  "redux-saga": "REMOVE",
  "@reduxjs/toolkit": "REMOVE",
  "react-redux": "REMOVE",
  "@electric-sql/pglite": "REMOVE",
  "@electric-sql/pglite-sync": "REMOVE",
  "drizzle-orm": "REMOVE",
  "drizzle-kit": "REMOVE"
}
```

**Net**: 3 fewer dependencies

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Migration Strategy | Clean Break | No production users, all 6 pain points |
| Redux Future | Remove completely | React Context sufficient |
| Schema Design | Normalize | Fix FIXME, better integrity |
| Event Granularity | Domain commands | Match current methods |
| UI State | React hooks only | Maximum simplicity |
| Sync Migration | Defer to Phase 2 | Focus on local-first first |

---

## Resources

- LiveStore Docs: https://docs.livestore.dev
- LiveStore Discord: https://discord.gg/RbMcjUAPd7
- Getting Started: https://docs.livestore.dev/getting-started/react-web/
- LLM Docs: node_modules/@livestore/livestore/docs

---

## Next Steps

1. Review design
2. Approve design
3. Create branch: `feat/livestore-migration`
4. Start Phase 1
5. Daily standups
6. Weekly reviews

---

**End of Design Document**
