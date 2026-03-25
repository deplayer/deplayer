# Replace UIContext with Zustand Store — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate the context stampede caused by UIContext's single-object state by replacing it with a Zustand store using selector-based subscriptions.

**Architecture:** A single Zustand store replaces UIContext. Components subscribe to individual fields via selectors. Redux `app` reducer stays for now (sagas dispatch to it), but a thin middleware syncs Redux→Zustand. Components read from Zustand only.

**Tech Stack:** Zustand, React, Redux (existing), LiveStore (existing), Vitest

---

### Task 1: Install Zustand and create the UI store

**Files:**
- Create: `src/stores/uiStore.ts`

**Step 1: Install Zustand**

Run: `npm install zustand`

**Step 2: Create the Zustand store**

Create `src/stores/uiStore.ts` with all fields and actions from the current `UIContext`:

```ts
import { create } from 'zustand'

export type Filter = {
  genres: string[]
  types: string[]
  artists: string[]
  providers: string[]
  favorites: boolean
}

type UIState = {
  // Layout
  sidebarToggled: boolean
  rightPanelToggled: boolean
  mqlMatch: boolean
  heightMqlMatch: boolean
  loading: boolean
  displayMiniQueue: boolean

  // Modals
  showAddMediaModal: boolean

  // Visuals
  showSpectrum: boolean
  showVisuals: boolean
  backgroundImage: string

  // App state
  ready: boolean

  // Search & Filters
  activeFilters: Filter
  searchTerm: string
  searchActive: boolean
}

type UIActions = {
  toggleSidebar: (value?: boolean) => void
  toggleRightPanel: (value?: boolean) => void
  setMqlMatch: (value: boolean) => void
  setHeightMqlMatch: (value: boolean) => void
  setLoading: (loading: boolean) => void
  toggleMiniQueue: () => void
  setShowAddMediaModal: (show: boolean) => void
  toggleSpectrum: () => void
  toggleVisuals: () => void
  setBackgroundImage: (url: string) => void
  setReady: (ready: boolean) => void
  setFilter: (filterType: keyof Filter, values: string[] | boolean) => void
  clearFilters: () => void
  setSearchTerm: (term: string) => void
  clearSearch: () => void
}

const emptyFilters: Filter = {
  genres: [],
  types: [],
  artists: [],
  providers: [],
  favorites: false,
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  // Initial state
  sidebarToggled: false,
  rightPanelToggled: false,
  mqlMatch: false,
  heightMqlMatch: false,
  loading: true,
  displayMiniQueue: true,
  showAddMediaModal: false,
  showSpectrum: false,
  showVisuals: false,
  backgroundImage: '',
  ready: false,
  activeFilters: emptyFilters,
  searchTerm: '',
  searchActive: false,

  // Actions
  toggleSidebar: (value) =>
    set((s) => ({ sidebarToggled: value !== undefined ? value : !s.sidebarToggled })),
  toggleRightPanel: (value) =>
    set((s) => ({ rightPanelToggled: value !== undefined ? value : !s.rightPanelToggled })),
  setMqlMatch: (value) => set({ mqlMatch: value }),
  setHeightMqlMatch: (value) => set({ heightMqlMatch: value }),
  setLoading: (loading) => set({ loading }),
  toggleMiniQueue: () => set((s) => ({ displayMiniQueue: !s.displayMiniQueue })),
  setShowAddMediaModal: (show) => set({ showAddMediaModal: show }),
  toggleSpectrum: () => set((s) => ({ showSpectrum: !s.showSpectrum })),
  toggleVisuals: () => set((s) => ({ showVisuals: !s.showVisuals })),
  setBackgroundImage: (url) => set({ backgroundImage: url }),
  setReady: (ready) => set({ ready }),
  setFilter: (filterType, values) =>
    set((s) => ({ activeFilters: { ...s.activeFilters, [filterType]: values } })),
  clearFilters: () => set({ activeFilters: emptyFilters }),
  setSearchTerm: (term) => set({ searchTerm: term, searchActive: term.trim().length > 0 }),
  clearSearch: () => set({ searchTerm: '', searchActive: false }),
}))
```

**Step 3: Run lint on new file**

Run: `npx eslint src/stores/uiStore.ts`
Expected: No errors.

**Step 4: Commit**

```bash
jj describe -m "feat: add Zustand UI store to replace UIContext"
jj new
```

---

### Task 2: Add Redux→Zustand sync middleware

Sagas still dispatch to Redux (`INITIALIZED`, `SET_MQL`, `SET_HEIGHT_MQL`, `SET_BACKGROUND_IMAGE`, `TOGGLE_SIDEBAR`, etc.). A middleware syncs these to Zustand so components can read from one source.

**Files:**
- Create: `src/middleware/uiSync.ts`
- Modify: `src/store/configureStore.ts` (add middleware)

**Step 1: Create the sync middleware**

Create `src/middleware/uiSync.ts`:

```ts
import { Middleware } from 'redux'
import { useUIStore } from '../stores/uiStore'
import * as types from '../constants/ActionTypes'

/**
 * Redux middleware that syncs app-related actions to the Zustand UI store.
 * This is a transitional bridge — once sagas are updated to call Zustand
 * directly, this middleware can be removed.
 */
export const uiSyncMiddleware: Middleware = () => (next) => (action: any) => {
  const result = next(action)
  const store = useUIStore.getState()

  switch (action.type) {
    case types.SET_MQL:
      store.setMqlMatch(action.value)
      break
    case types.SET_HEIGHT_MQL:
      store.setHeightMqlMatch(action.value)
      break
    case types.INITIALIZED:
      store.setLoading(false)
      break
    case types.TOGGLE_SIDEBAR:
      store.toggleSidebar(action.value)
      break
    case types.TOGGLE_RIGHT_PANEL:
      store.toggleRightPanel(action.value)
      break
    case types.TOGGLE_SPECTRUM:
      store.toggleSpectrum()
      break
    case types.TOGGLE_VISUALS:
      store.toggleVisuals()
      break
    case types.SHOW_ADD_MEDIA_MODAL:
      store.setShowAddMediaModal(true)
      break
    case types.HIDE_ADD_MEDIA_MODAL:
      store.setShowAddMediaModal(false)
      break
    case types.TOGGLE_MINI_QUEUE:
      store.toggleMiniQueue()
      break
    case types.SET_BACKGROUND_IMAGE:
      store.setBackgroundImage(action.backgroundImage)
      break
    case types.APP_READY:
      store.setReady(true)
      break
  }

  return result
}
```

**Step 2: Register middleware in configureStore.ts**

In `src/store/configureStore.ts`, add import and include in middleware array:

```ts
import { uiSyncMiddleware } from '../middleware/uiSync'
```

Add to the middlewares array (find where other middlewares are defined).

**Step 3: Run lint and type check**

Run: `npx eslint src/middleware/uiSync.ts && npx tsc --noEmit 2>&1 | grep uiSync`
Expected: Clean.

**Step 4: Commit**

```bash
jj describe -m "feat: add Redux→Zustand sync middleware for UI state"
jj new
```

---

### Task 3: Migrate all useUI() consumers to useUIStore selectors

Replace every `useUI()` call with targeted `useUIStore(s => ...)` selectors. Each component only subscribes to the fields it uses.

**Files to modify (14 files):**

**Step 1: Migrate each file**

For each file, replace `import { useUI } from '..../contexts'` with `import { useUIStore } from '..../stores/uiStore'` and destructured calls with selectors.

**`src/components/MusicTable/MusicTable.tsx`**
```ts
// BEFORE: const { loading, mqlMatch } = useUI()
// AFTER:
const loading = useUIStore(s => s.loading)
const mqlMatch = useUIStore(s => s.mqlMatch)
```

**`src/components/Collection.tsx`**
```ts
// BEFORE: const { loading, activeFilters, searchTerm } = useUI()
// AFTER:
const loading = useUIStore(s => s.loading)
const activeFilters = useUIStore(s => s.activeFilters)
const searchTerm = useUIStore(s => s.searchTerm)
```

**`src/components/ArtistsTable/ArtistTable.tsx`**
```ts
// BEFORE: const { sidebarToggled, mqlMatch } = useUI()
// AFTER:
const sidebarToggled = useUIStore(s => s.sidebarToggled)
const mqlMatch = useUIStore(s => s.mqlMatch)
```

**`src/components/Queue.tsx`**
```ts
// BEFORE: const { loading, mqlMatch, displayMiniQueue } = useUI()
// AFTER:
const loading = useUIStore(s => s.loading)
const mqlMatch = useUIStore(s => s.mqlMatch)
const displayMiniQueue = useUIStore(s => s.displayMiniQueue)
```

**`src/components/CommandBar/index.tsx`**
```ts
// BEFORE: const { searchTerm: globalSearchTerm } = useUI()
// AFTER:
const globalSearchTerm = useUIStore(s => s.searchTerm)
```

**`src/components/Sidebar/SidebarContents.tsx`**
```ts
// BEFORE: const { searchTerm } = useUI()
// AFTER:
const searchTerm = useUIStore(s => s.searchTerm)
```

**`src/components/Topbar/Topbar.tsx`**
```ts
// BEFORE: const { setSearchTerm } = useUI()
// AFTER:
const setSearchTerm = useUIStore(s => s.setSearchTerm)
```

**`src/components/Collection/FilterPanel.tsx`**
```ts
// BEFORE: const { activeFilters, setFilter } = useUI()
// AFTER:
const activeFilters = useUIStore(s => s.activeFilters)
const setFilter = useUIStore(s => s.setFilter)
```

**`src/components/Dashboard/GenreChips.tsx`**
```ts
// BEFORE: const { setFilter, clearFilters } = useUI()
// AFTER:
const setFilter = useUIStore(s => s.setFilter)
const clearFilters = useUIStore(s => s.clearFilters)
```

**`src/components/SongView/index.tsx`**
```ts
// BEFORE: const { setFilter, clearFilters } = useUI()
// AFTER:
const setFilter = useUIStore(s => s.setFilter)
const clearFilters = useUIStore(s => s.clearFilters)
```

**`src/components/Playlists/Playlist.tsx`**
```ts
// BEFORE: const { setFilter, clearFilters } = useUI()
// AFTER:
const setFilter = useUIStore(s => s.setFilter)
const clearFilters = useUIStore(s => s.clearFilters)
```

**`src/components/Playlists/GenreTagCloud.tsx`**
```ts
// BEFORE: const { setFilter, clearFilters } = useUI()
// AFTER:
const setFilter = useUIStore(s => s.setFilter)
const clearFilters = useUIStore(s => s.clearFilters)
```

**`src/App.tsx`** — Remove the Redux→UIContext bridge effects:
```ts
// DELETE these useEffect blocks:
// React.useEffect(() => { setLoading(reduxApp.loading) }, ...)
// React.useEffect(() => { setMqlMatch(reduxApp.mqlMatch) }, ...)
// React.useEffect(() => { setHeightMqlMatch(reduxApp.heightMqlMatch) }, ...)
// Also remove: const { setLoading, setMqlMatch, setHeightMqlMatch } = useUI()
```

**`src/stores/livestore/hooks/useMedia.ts`** — Only a JSDoc comment reference, no code change needed.

**Step 2: Remove UIContext import from each file**

Remove `import { useUI } from '../../contexts'` (or similar) from every migrated file. Remove `useUI` from `src/contexts/index.ts` exports.

**Step 3: Run full type check**

Run: `npx tsc --noEmit`
Expected: No errors related to useUI/useUIStore.

**Step 4: Run tests**

Run: `npm test`
Expected: All pass.

**Step 5: Commit**

```bash
jj describe -m "refactor: migrate all useUI() consumers to useUIStore selectors"
jj new
```

---

### Task 4: Internalize activeFilters/searchTerm in LiveStore hooks

LiveStore hooks currently receive `activeFilters` and `searchTerm` as parameters. Internalize them by reading from Zustand directly.

**Files:**
- Modify: `src/stores/livestore/hooks/useCollectionData.ts`
- Modify: `src/components/Collection.tsx` (remove args)

**Step 1: Update useCollectionData to read from Zustand**

In `src/stores/livestore/hooks/useCollectionData.ts`:

```ts
// BEFORE:
export const useCollectionData = (filters: Filter, searchTerm: string) => {

// AFTER:
import { useUIStore } from '../../uiStore'

export const useCollectionData = () => {
  const filters = useUIStore(s => s.activeFilters)
  const searchTerm = useUIStore(s => s.searchTerm)
```

**Step 2: Update Collection.tsx caller**

```ts
// BEFORE:
const { ids, map } = useCollectionData(activeFilters, searchTerm)

// AFTER:
const { ids, map } = useCollectionData()
```

Remove `activeFilters` and `searchTerm` from the component's Zustand selectors if no longer needed locally.

**Step 3: Run type check and tests**

Run: `npx tsc --noEmit && npm test`
Expected: All pass.

**Step 4: Commit**

```bash
jj describe -m "refactor: internalize activeFilters/searchTerm in useCollectionData"
jj new
```

---

### Task 5: Delete UIContext and UIProvider

**Files:**
- Delete: `src/contexts/UIContext.tsx`
- Modify: `src/contexts/index.ts` (remove UIContext exports)
- Modify: `src/App.tsx` (remove UIProvider wrapper)

**Step 1: Remove UIProvider from App.tsx**

In `src/App.tsx`, remove the `<UIProvider>` wrapper from the component tree. Remove the import.

**Step 2: Remove UIContext exports from contexts/index.ts**

Remove `UIProvider`, `useUI`, and any UIContext-related exports.

**Step 3: Delete UIContext.tsx**

Run: `rm src/contexts/UIContext.tsx`

**Step 4: Check for any remaining references**

Run: `grep -r "UIContext\|useUI\|UIProvider" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules`
Expected: No results (or only the deleted file).

**Step 5: Run full verification**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: All pass.

**Step 6: Commit**

```bash
jj describe -m "refactor: delete UIContext, replaced by Zustand useUIStore"
jj new
```

---

### Task 6: Migrate remaining Redux `state.app` consumers to Zustand

Components still reading from Redux `state.app` via `useSelector` or `connect` should switch to Zustand selectors. This eliminates the double-source-of-truth.

**Files:**
- Modify: `src/components/Sidebar/Sidebar.tsx` — replace `useSelector(s => s.app.sidebarToggled)` and `useSelector(s => s.app.mqlMatch)` with `useUIStore`
- Modify: `src/containers/LayoutContainer.tsx` — replace `state.app.backgroundImage` and `state.app` with Zustand selectors
- Modify: `src/containers/RightPanelContainer.tsx` — replace `state.app.rightPanelToggled`
- Modify: `src/containers/ContextMenuContainer.tsx` — replace `state.app`
- Modify: `src/containers/PlayerContainer.tsx` — replace `state.app`
- Modify: `src/components/AddMediaModal/index.tsx` — replace `state.app.showAddMediaModal`
- Modify: `src/pages/JoinRoom.ts` — replace `state.app.ready`

For each:
- Replace `useSelector((state: State) => state.app.X)` with `useUIStore(s => s.X)`
- For `connect()` components, convert to functional components with hooks or use `useUIStore.getState()` where needed

**Step 1: Migrate each file** (same pattern as Task 3)

**Step 2: Run full verification**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: All pass.

**Step 3: Commit**

```bash
jj describe -m "refactor: migrate Redux state.app consumers to Zustand useUIStore"
jj new
```

---

### Task 7: Final verification and cleanup

**Step 1: Run full quality check**

```bash
npm run lint
npm test
npm run build
```

All must pass.

**Step 2: Check no orphaned UIContext references remain**

```bash
grep -r "UIContext\|useUI[^S]\|UIProvider" src/ --include="*.ts" --include="*.tsx"
```

Expected: No results.

**Step 3: Check Zustand store is the single source of truth**

```bash
grep -r "state\.app\." src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".spec." | grep -v reducers/
```

Expected: Only the sync middleware and configureStore.ts references remain.

**Step 4: Manual smoke test**

1. `npm run dev`
2. Navigate between Dashboard → Collection → Artists → Queue rapidly
3. Verify no FPS drops during navigation
4. Play a song, navigate sections — playback should remain smooth
5. Test search, filters, sidebar toggle

**Step 5: Final commit**

```bash
jj describe -m "perf: replace UIContext with Zustand — eliminate context stampede on navigation"
```

---

## Summary

| Task | What it does |
|------|-------------|
| 1 | Create Zustand store with identical state/actions |
| 2 | Sync middleware: Redux→Zustand bridge for saga dispatches |
| 3 | Migrate all 14 `useUI()` consumers to `useUIStore` selectors |
| 4 | Internalize filters/search in LiveStore hooks |
| 5 | Delete UIContext and UIProvider |
| 6 | Migrate remaining Redux `state.app` consumers |
| 7 | Final verification and cleanup |
