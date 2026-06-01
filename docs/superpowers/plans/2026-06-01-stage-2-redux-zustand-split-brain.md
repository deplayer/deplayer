# Stage 2: Collapse Redux/Zustand UI-state split-brain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the duplicate UI-state ownership between the Redux `app` reducer and the Zustand `useUIStore`. Components read UI state from one source (`useUIStore`) and mutate it via store actions, not Redux dispatches. Delete the `uiSyncMiddleware` Redux→Zustand bridge and the `app` reducer.

**Architecture:** Today 11 UI fields live in both `reducers/app.ts` and `stores/uiStore.ts`, kept in sync by `middleware/uiSync.ts`. Search state is also split (`searchTerm` in both, `searchToggled` only in Redux, with no sync). We migrate readers and dispatchers component-by-component to `useUIStore`, then delete the bridge and the reducer. Sagas that emit UI actions (`SET_BACKGROUND_IMAGE`, `TOGGLE_SIDEBAR`) call `useUIStore.setState` directly. After this stage Redux owns playback transport, search results, artist metadata, peers, rooms, i18n — no UI state.

**Tech Stack:** TypeScript, React 18, Redux Toolkit (existing, being reduced), redux-saga, Zustand, Vitest, React Testing Library.

---

## Pre-flight

Before Task 1: confirm `master` is clean and tests green.

```bash
cd /home/genar/src/deplayer
git status                           # working tree clean
git log --oneline -1                 # latest commit
npm test -- --run 2>&1 | tail -3     # 218 passed, 1 skipped
npx tsc --noEmit                     # zero output
```

Expected: `218 passed | 1 skipped`, `tsc` silent.

---

## Task 1: Extend uiStore with searchToggled + searchResults

**Why first:** `useUIStore` already owns `searchTerm` but `searchToggled` lives only in Redux `search.searchToggled`. The Redux `search.searchResults` field is also UI-adjacent (it's just IDs the search UI displays). Add both to `useUIStore` plus a `toggleSearch` action and a `setSearchResults` action so later tasks have something to migrate to.

**Files:**
- Modify: `src/stores/uiStore.ts`
- Test: `src/stores/uiStore.spec.ts` (NEW)

- [ ] **Step 1: Write the failing test**

Create `src/stores/uiStore.spec.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from './uiStore'

describe('useUIStore searchToggled', () => {
  beforeEach(() => {
    useUIStore.setState({
      searchToggled: false,
      searchResults: [],
      searchTerm: '',
      searchActive: false,
    })
  })

  it('toggleSearch flips searchToggled', () => {
    expect(useUIStore.getState().searchToggled).toBe(false)
    useUIStore.getState().toggleSearch()
    expect(useUIStore.getState().searchToggled).toBe(true)
    useUIStore.getState().toggleSearch()
    expect(useUIStore.getState().searchToggled).toBe(false)
  })

  it('toggleSearchOff forces searchToggled false', () => {
    useUIStore.setState({ searchToggled: true })
    useUIStore.getState().toggleSearchOff()
    expect(useUIStore.getState().searchToggled).toBe(false)
    // Idempotent
    useUIStore.getState().toggleSearchOff()
    expect(useUIStore.getState().searchToggled).toBe(false)
  })

  it('setSearchResults replaces the result ids', () => {
    useUIStore.getState().setSearchResults(['a', 'b', 'c'])
    expect(useUIStore.getState().searchResults).toEqual(['a', 'b', 'c'])
    useUIStore.getState().setSearchResults([])
    expect(useUIStore.getState().searchResults).toEqual([])
  })

  it('clearSearch resets term, active, and results', () => {
    useUIStore.setState({
      searchTerm: 'foo',
      searchActive: true,
      searchResults: ['x'],
    })
    useUIStore.getState().clearSearch()
    const s = useUIStore.getState()
    expect(s.searchTerm).toBe('')
    expect(s.searchActive).toBe(false)
    expect(s.searchResults).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/stores/uiStore.spec.ts`
Expected: FAIL — `toggleSearch`, `toggleSearchOff`, `setSearchResults` undefined; `searchResults` not on state.

- [ ] **Step 3: Extend uiStore**

Replace the `UIState` and `UIActions` types and the implementation in `src/stores/uiStore.ts`. The full file becomes:

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
  searchToggled: boolean
  searchResults: string[]
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
  toggleSearch: () => void
  toggleSearchOff: () => void
  setSearchResults: (ids: string[]) => void
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
  searchToggled: false,
  searchResults: [],

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
  toggleSearch: () => set((s) => ({ searchToggled: !s.searchToggled })),
  toggleSearchOff: () => set({ searchToggled: false }),
  setSearchResults: (ids) => set({ searchResults: ids }),
  clearSearch: () =>
    set({ searchTerm: '', searchActive: false, searchResults: [] }),
}))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/stores/uiStore.spec.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/stores/uiStore.ts src/stores/uiStore.spec.ts
git commit -m "feat(uiStore): add searchToggled + searchResults + actions

Mirror the fields that still live in Redux search reducer so later tasks
can move readers off Redux atomically."
```

---

## Task 2: Migrate RightPanelContainer

**Why second:** Smallest reader. Pure swap, no prop drilling.

**Files:**
- Modify: `src/containers/RightPanelContainer.tsx`

- [ ] **Step 1: Replace useSelector + dispatch with useUIStore**

Edit `src/containers/RightPanelContainer.tsx`. The full file becomes:

```tsx
import Sidebar from 'react-sidebar'
import Social from '../pages/Social'
import { useUIStore } from '../stores/uiStore'

const SidebarContents = () => {
  return <div className='w-full h-full'>
    <Social />
  </div>
}

const RightPanelContainer = () => {
  const rightPanelToggled = useUIStore((s) => s.rightPanelToggled)
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel)

  return (
    <Sidebar
      sidebar={<SidebarContents />}
      open={rightPanelToggled}
      pullRight={true}
      onSetOpen={(open: boolean) => toggleRightPanel(open)}
      sidebarId='right-sidebar'
      sidebarClassName='w-64 bg-base-200/70 backdrop-blur fixed'
      overlayId='right-sidebar-overlay'
      overlayClassName='fixed inset-0'
      contentId='right-sidebar-content'
      styles={{
        overlay: { backgroundColor: 'rgba(0, 0, 0, 0.3)', zIndex: '40' },
        sidebar: { position: 'fixed', zIndex: '50' },
        content: { position: 'relative' }
      }}
    >
      <div id='right-sidebar-content' />
    </Sidebar>
  )
}

export default RightPanelContainer
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: silent.

- [ ] **Step 3: Verify existing tests pass**

Run: `npm test -- --run 2>&1 | tail -5`
Expected: `218 passed | 1 skipped` (no regression; `Topbar.spec.tsx` does NOT mount RightPanelContainer).

- [ ] **Step 4: Commit**

```bash
git add src/containers/RightPanelContainer.tsx
git commit -m "refactor(ui): migrate RightPanelContainer to useUIStore"
```

---

## Task 3: Migrate AddMediaModal

**Files:**
- Modify: `src/components/AddMediaModal/index.tsx`

- [ ] **Step 1: Replace connect() + dispatched HIDE_ADD_MEDIA_MODAL with useUIStore**

The current file uses `connect()` for `showAddMediaModal` and dispatches `HIDE_ADD_MEDIA_MODAL` three times. The webtorrent magnet UI still dispatches `ADD_WEBTORRENT_MEDIA` into the void (Stage 1 left it; we don't touch it here). Replace the imports and the connect HOC. Final shape:

Top of file:

```tsx
import React from 'react'
import { toMagnetURI, remote } from 'parse-torrent'

import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'
import { useUIStore } from '../../stores/uiStore'

import fileManager from '../../services/Filesystem/FileManager'

const AddMediaModal = () => {
  const showAddMediaModal = useUIStore((s) => s.showAddMediaModal)
  const closeModal = useUIStore((s) => () => s.setShowAddMediaModal(false))

  const [magnetLink, setMagnetLink] = React.useState('')
  const [torrent, setTorrent] = React.useState<File>()
  const [youtubeLink, setYoutubeLink] = React.useState('')

  if (!showAddMediaModal) {
    return null
  }

  // …rest of the JSX unchanged EXCEPT:
  //   onClose={() => { props.dispatch({ type: types.HIDE_ADD_MEDIA_MODAL }) }}
  //     becomes  onClose={closeModal}
  //   every other  props.dispatch({ type: types.HIDE_ADD_MEDIA_MODAL })
  //     becomes  closeModal()
  //   props.dispatch({ type: types.ADD_WEBTORRENT_MEDIA, magnet: … })
  //     stays the same (still uses Redux dispatch through useDispatch)
}

export default AddMediaModal
```

Add `import { useDispatch } from 'react-redux'` and a `const dispatch = useDispatch()` inside the component so the `ADD_WEBTORRENT_MEDIA` and `SEND_NOTIFICATION` dispatches still work without `props.dispatch`. Final imports:

```tsx
import { useDispatch } from 'react-redux'
import React from 'react'
import { toMagnetURI, remote } from 'parse-torrent'

import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'
import * as types from '../../constants/ActionTypes'
import { useUIStore } from '../../stores/uiStore'

import fileManager from '../../services/Filesystem/FileManager'
```

Component header:

```tsx
const AddMediaModal = () => {
  const dispatch = useDispatch()
  const showAddMediaModal = useUIStore((s) => s.showAddMediaModal)
  const setShowAddMediaModal = useUIStore((s) => s.setShowAddMediaModal)
  const closeModal = () => setShowAddMediaModal(false)

  const [magnetLink, setMagnetLink] = React.useState('')
  const [torrent, setTorrent] = React.useState<File>()
  const [youtubeLink, setYoutubeLink] = React.useState('')

  if (!showAddMediaModal) {
    return null
  }

  return (
    <Modal
      title='Select media to add'
      isOpen={showAddMediaModal}
      onClose={closeModal}
      className="w-[800px] max-w-[90vw]"
    >
      {/* … keep entire body, swapping every props.dispatch({ type: types.HIDE_ADD_MEDIA_MODAL }) for closeModal() and props.dispatch -> dispatch */}
    </Modal>
  )
}

export default AddMediaModal
```

Delete the `connect()` HOC at the bottom of the file. The export is now the component directly.

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: silent.

- [ ] **Step 3: Verify tests pass**

Run: `npm test -- --run 2>&1 | tail -5`
Expected: `218 passed | 1 skipped`.

- [ ] **Step 4: Commit**

```bash
git add src/components/AddMediaModal/index.tsx
git commit -m "refactor(ui): migrate AddMediaModal to useUIStore"
```

---

## Task 4: Migrate ContextualMenu (Player)

**Files:**
- Modify: `src/components/Player/ContextualMenu.tsx`

Reads `state.app.showVisuals` (line 164) and `state.app.showSpectrum` (line 188); dispatches `TOGGLE_VISUALS` (line 152) and `TOGGLE_SPECTRUM` (line 176). Player state stays in Redux (covered by Stage 3, not this stage).

- [ ] **Step 1: Replace the app slice read with targeted useUIStore reads**

In `src/components/Player/ContextualMenu.tsx`, change the top of the component:

```tsx
// Before
const ContextualMenu = () => {
  const app = useSelector((state: State) => state.app)
  const player = useSelector((state: State) => state.player)
  const dispatch = useDispatch()

// After
const ContextualMenu = () => {
  const showVisuals = useUIStore((s) => s.showVisuals)
  const showSpectrum = useUIStore((s) => s.showSpectrum)
  const toggleVisuals = useUIStore((s) => s.toggleVisuals)
  const toggleSpectrum = useUIStore((s) => s.toggleSpectrum)
  const player = useSelector((state: State) => state.player)
  const dispatch = useDispatch()
```

Add `import { useUIStore } from '../../stores/uiStore'` near the existing imports. Remove the `useSelector` import only if no other reader remains (keep it — `player` still reads via useSelector).

Replace usages:
- `app.showVisuals` (line 164) → `showVisuals`
- `app.showSpectrum` (line 188) → `showSpectrum`
- `dispatch({ type: types.TOGGLE_VISUALS })` (line 152) → `toggleVisuals()`
- `dispatch({ type: types.TOGGLE_SPECTRUM })` (line 176) → `toggleSpectrum()`

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: silent.

- [ ] **Step 3: Verify tests pass**

Run: `npm test -- --run src/components/MusicTable/ContextualMenu.spec.tsx 2>&1 | tail -5`
Expected: 28 tests pass (this spec covers the table's contextual menu — note the player's `ContextualMenu` is `src/components/Player/ContextualMenu.tsx`, a different file with no dedicated spec; the global test run must still pass).

Then full suite:

```bash
npm test -- --run 2>&1 | tail -5
```
Expected: `218 passed | 1 skipped`.

- [ ] **Step 4: Commit**

```bash
git add src/components/Player/ContextualMenu.tsx
git commit -m "refactor(ui): migrate Player/ContextualMenu to useUIStore"
```

---

## Task 5: Migrate Sidebar (component + SidebarContents)

**Files:**
- Modify: `src/components/Sidebar/Sidebar.tsx`
- Modify: `src/components/Sidebar/SidebarContents.tsx` (also reads `app` via props)

- [ ] **Step 1: Inspect SidebarContents to confirm prop usage**

Run: `grep -nE 'props\.app|app\.|app: AppState|from .*reducers/app|\{[^}]*\}\s*=\s*props\.app' src/components/Sidebar/SidebarContents.tsx`
Expected: enumerate every `app` reference (props access, destructure, type import).

If SidebarContents uses any `app.X` value, swap those for `useUIStore((s) => s.X)` reads inside SidebarContents and remove the `app` prop. If it uses only `sidebarToggled`, the cleanest path is:

- Remove the `app` prop entirely from `SidebarContents`'s type.
- Each callsite stops passing it.
- Inside SidebarContents, read fields from useUIStore directly.

- [ ] **Step 2: Edit Sidebar.tsx**

The top of `Sidebar.tsx` currently does:

```tsx
const mqlMatch = useUIStore(s => s.mqlMatch)
const app = useSelector((state: State) => state.app)
const player = useSelector((state: State) => state.player)
```

Replace `const app = useSelector(...)` with the specific Zustand reads SidebarContents needed (sidebarToggled, ready, etc — confirmed in Step 1). Then update the JSX so `app={app}` becomes individual props OR remove if SidebarContents now reads directly.

The dispatch at line 24 (`dispatch({ type: types.TOGGLE_SIDEBAR, value: open })`) becomes:

```tsx
const toggleSidebar = useUIStore((s) => s.toggleSidebar)
// …
if (!docked) {
  toggleSidebar(open)
}
```

Remove `useDispatch`, `useSelector`, and `import * as types` if no longer used. Remove `import type { State } from '../../reducers'` if no longer used.

- [ ] **Step 3: Edit SidebarContents.tsx**

Drop the `app` prop. Replace each `props.app.X` access with `useUIStore((s) => s.X)`.

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: silent.

- [ ] **Step 5: Verify tests pass**

Run: `npm test -- --run 2>&1 | tail -5`
Expected: `218 passed | 1 skipped`.

- [ ] **Step 6: Commit**

```bash
git add src/components/Sidebar/Sidebar.tsx src/components/Sidebar/SidebarContents.tsx
git commit -m "refactor(ui): migrate Sidebar + SidebarContents to useUIStore"
```

---

## Task 6: Migrate Topbar + SearchButton + TopbarContainer (search splitbrain)

**Files:**
- Modify: `src/components/Topbar/Topbar.tsx`
- Modify: `src/components/Buttons/SearchButton.tsx`
- Modify: `src/containers/TopbarContainer.tsx`
- Modify: `src/components/Topbar/Topbar.spec.tsx` (test asserts `TOGGLE_SEARCH_OFF` dispatch; update to assert uiStore toggleSearchOff fires)

Search state today is split: `searchTerm` is double-written (Redux `search.searchTerm` AND uiStore `searchTerm`), `searchToggled` is Redux-only, `loading` is Redux-only. This task moves `searchToggled` to uiStore. `loading` stays in Redux for now (the search saga writes it; moving it requires changing the saga, deferred).

- [ ] **Step 1: SearchButton — read searchToggled from uiStore**

`src/components/Buttons/SearchButton.tsx` lines 7–11. Replace:

```tsx
const dispatch = useDispatch()
const searchToggled = useSelector((state: { search: { searchToggled: boolean } }) => state.search.searchToggled)

const toggleSearch = () => {
  dispatch({ type: types.TOGGLE_SEARCH })
}
```

with:

```tsx
const searchToggled = useUIStore((s) => s.searchToggled)
const toggleSearch = useUIStore((s) => s.toggleSearch)
```

Update the click handler to `onClick={toggleSearch}`. Drop now-unused imports (`useDispatch`, `useSelector`, `types` if no other use).

Add: `import { useUIStore } from '../../stores/uiStore'`.

- [ ] **Step 2: Topbar — replace TOGGLE_SEARCH/TOGGLE_SEARCH_OFF dispatches with uiStore actions**

`src/components/Topbar/Topbar.tsx` lines 58–67, 104, 111 dispatch TOGGLE_SEARCH (twice), TOGGLE_SEARCH_OFF, TOGGLE_RIGHT_PANEL. Inside the Topbar component:

```tsx
// Add near top:
import { useUIStore } from '../../stores/uiStore'

// Inside Topbar component:
const toggleSearch = useUIStore((s) => s.toggleSearch)
const toggleSearchOff = useUIStore((s) => s.toggleSearchOff)
const toggleRightPanel = useUIStore((s) => s.toggleRightPanel)
```

Replace:
- `props.dispatch({ type: types.TOGGLE_SEARCH })` → `toggleSearch()`
- `props.dispatch({ type: types.TOGGLE_SEARCH_OFF })` → `toggleSearchOff()`
- `props.dispatch({ type: types.TOGGLE_RIGHT_PANEL })` → `toggleRightPanel()`

- [ ] **Step 3: Update Topbar.spec.tsx**

`src/components/Topbar/Topbar.spec.tsx` lines 99–110 assert that a click dispatches `TOGGLE_RIGHT_PANEL`. After the migration that dispatch is gone — the side-effect is on `useUIStore`. Rewrite the test to check uiStore state instead. Same for the `TOGGLE_SEARCH_OFF` test at line 230.

Replace the "Share room button" test:

```tsx
it('should toggle the right panel when share button is clicked', () => {
  const { useUIStore } = await import('../../stores/uiStore')
  useUIStore.setState({ rightPanelToggled: false })
  const { getByTitle } = renderTopbar()
  fireEvent.click(getByTitle('Share room'))
  expect(useUIStore.getState().rightPanelToggled).toBe(true)
})
```

Replace the `TOGGLE_SEARCH_OFF` test similarly: assert `useUIStore.getState().searchToggled` ends at `false`.

If the spec is async-import-unfriendly, do a top-of-file `import { useUIStore } from '../../stores/uiStore'` and reference directly.

- [ ] **Step 4: TopbarContainer — stop passing app + search slices**

`src/containers/TopbarContainer.tsx` lines 185–188 connect `state.search` and `state.app`. Both are now redundant — Topbar reads what it needs from `useUIStore`. The container becomes a hooks-only wrapper. Replace the full file body's connection section with:

```tsx
// Delete the connect import + connect() at the bottom.
// TopbarWrapper becomes the default export, and it pulls everything from hooks.

const TopbarContainer = ({ children }: { children?: React.ReactNode }) => {
  const dispatch = useDispatch()
  const location = useLocation()

  const searchTerm = useUIStore((s) => s.searchTerm)
  const searchToggled = useUIStore((s) => s.searchToggled)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const loading = useSelector((state: RootState) => state.search.loading)

  const liveQueue = useQueue('default')

  const { type: detailType, id: detailId } = extractIdFromPath(location.pathname)
  const title = detailType && detailId
    ? <DynamicDetailTitle type={detailType} id={detailId} />
    : staticTitle(location.pathname, searchTerm)

  const parseTrackIds = (ids: string | string[] | null | undefined): string[] => {
    if (!ids) return []
    if (Array.isArray(ids)) return ids
    try { return JSON.parse(ids) } catch { return [] }
  }
  const queueTrackIds = liveQueue?.shuffle
    ? parseTrackIds(liveQueue.randomTrackIds)
    : parseTrackIds(liveQueue?.trackIds)
  const hasResults = queueTrackIds && queueTrackIds.length ? true : false
  const inHome = location.pathname === '/' ? true : false

  return (
    <Topbar
      title={title}
      loading={loading}
      showInCenter={!hasResults && inHome}
      searchTerm={searchTerm}
      searchToggled={searchToggled}
      dispatch={dispatch}
      onSetSidebarOpen={(open: boolean) => toggleSidebar(open)}
    >
      {children}
    </Topbar>
  )
}

export default TopbarContainer
```

Add the needed imports: `useDispatch`, `useSelector` (still needed for `state.search.loading`), `useUIStore`.

Update the `TopbarProps` in `src/components/Topbar/Topbar.tsx` if it required an `app` prop — remove it. If Topbar.tsx uses `props.app.X`, also migrate those reads to `useUIStore`.

- [ ] **Step 5: Verify typecheck and tests**

```bash
npx tsc --noEmit
npm test -- --run src/components/Topbar/Topbar.spec.tsx 2>&1 | tail -5
npm test -- --run 2>&1 | tail -5
```
Expected: silent tsc; Topbar spec green; full suite `218 passed | 1 skipped`.

- [ ] **Step 6: Commit**

```bash
git add src/components/Topbar src/components/Buttons/SearchButton.tsx src/containers/TopbarContainer.tsx
git commit -m "refactor(ui): collapse search splitbrain into useUIStore

SearchButton + Topbar + TopbarContainer no longer touch Redux for
searchToggled. Topbar.spec asserts uiStore state instead of dispatched
actions."
```

---

## Task 7: Migrate LayoutContainer

**Files:**
- Modify: `src/containers/LayoutContainer.tsx`

`LayoutContainer` is `connect()`-wrapped and reads `state.app.backgroundImage`, `state.app.mqlMatch`, `state.app.showVisuals`, and `state.player.fullscreen`. After migration it becomes hooks-only for the app reads; `player` stays Redux until Stage 3.

- [ ] **Step 1: Replace connect with hooks**

Rewrite `src/containers/LayoutContainer.tsx`:

```tsx
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar/Sidebar'
import TopbarContainer from './TopbarContainer'
import SearchButton from '../components/Buttons/SearchButton'
import Placeholder from '../components/Player/Placeholder'
import ReloadPrompt from '../components/ReloadPrompt'
import type { State } from '../reducers'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import RightPanelContainer from './RightPanelContainer'
import ButterchurnVisualizer from '../components/ButterchurnVisualizer'
import PlayerRefService from '../services/PlayerRefService'
import { useUIStore } from '../stores/uiStore'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const dispatch = useDispatch()
  const backgroundImage = useUIStore((s) => s.backgroundImage)
  const mqlMatch = useUIStore((s) => s.mqlMatch)
  const showVisuals = useUIStore((s) => s.showVisuals)
  const fullscreen = useSelector((state: State) => state.player.fullscreen)

  const getInternalPlayer = () => {
    const playerRef = PlayerRefService.getInstance().getPlayerRef()
    if (!playerRef?.current) return null
    const internalPlayer = playerRef.current.getInternalPlayer()
    if (internalPlayer instanceof HTMLAudioElement) return internalPlayer
    return null
  }

  const internalPlayer = getInternalPlayer()

  const background = backgroundImage && (
    <>
      <div className='bg-handler before:bg-base-200/70'></div>
      <div
        className='absolute w-full h-full bg-cover bg-center bg-no-repeat bg-fixed glass'
        style={{ backgroundImage: `url(${backgroundImage})`, filter: 'blur(10px)' }}
      />
    </>
  )

  return (
    <>
      {background}
      <ToastContainer theme='dark' />
      <Sidebar>
        <ReloadPrompt />
        <TopbarContainer>
          <SearchButton />
        </TopbarContainer>
        <div className='layout-contents z-10'>
          {children}
        </div>
        <Placeholder mqlMatch={mqlMatch} />
      </Sidebar>
      {internalPlayer && showVisuals && (
        <ButterchurnVisualizer
          playerRef={internalPlayer}
          fullscreen={fullscreen}
          width={window.innerWidth}
          height={window.innerHeight}
          dispatch={dispatch}
        />
      )}
      <RightPanelContainer />
    </>
  )
}

export default Layout
```

- [ ] **Step 2: Verify typecheck and tests**

```bash
npx tsc --noEmit
npm test -- --run 2>&1 | tail -5
```
Expected: silent tsc; `218 passed | 1 skipped`.

- [ ] **Step 3: Commit**

```bash
git add src/containers/LayoutContainer.tsx
git commit -m "refactor(ui): migrate LayoutContainer to useUIStore"
```

---

## Task 8: Migrate PlayerContainer + PlayerControls

**Files:**
- Modify: `src/containers/PlayerContainer.tsx`
- Modify: `src/components/Player/PlayerControls.tsx`

PlayerContainer reads `state.app` and passes it down. PlayerControls uses three fields: `app.showVisuals` (line 359), `app.showSpectrum` (line 450), `app.mqlMatch` (line 472). Move those reads INTO PlayerControls via `useUIStore` and drop the prop.

PlayerControls is a class component. It can't call hooks directly. Wrap reads with a small functional inner OR convert PlayerControls' three uses to props sourced from a hook-wrapper.

Pragmatic choice: PlayerControls already has a wrapper `PlayerContainer`. Add the three values as hook reads in PlayerContainer and pass them as discrete props.

- [ ] **Step 1: PlayerContainer reads + passes discrete props**

In `src/containers/PlayerContainer.tsx`:

```tsx
// Remove:
const app = useSelector((state: State) => state.app)

// Add:
import { useUIStore } from '../stores/uiStore'
// …
const showVisuals = useUIStore((s) => s.showVisuals)
const showSpectrum = useUIStore((s) => s.showSpectrum)
const mqlMatch = useUIStore((s) => s.mqlMatch)
```

In the JSX:

```tsx
<PlayerControls
  // remove:  app={app}
  // add:
  showVisuals={showVisuals}
  showSpectrum={showSpectrum}
  mqlMatch={mqlMatch}
  slim={false}
  player={player}
  playerPortal={playerPortal}
  // …existing props
/>
```

- [ ] **Step 2: PlayerControls accepts discrete props**

`src/components/Player/PlayerControls.tsx` interface `Props`. Remove:

```tsx
collection: { rows: Record<string, any> }
app: AppState
```

Wait — `collection` is owned by Stage 3; keep it. Remove only `app: AppState` and `import { State as AppState } from '../../reducers/app'`.

Add to `Props`:

```tsx
showVisuals: boolean
showSpectrum: boolean
mqlMatch: boolean
```

Replace usages:
- `this.props.app.showVisuals` → `this.props.showVisuals`
- `this.props.app.showSpectrum` → `this.props.showSpectrum`
- `this.props.app.mqlMatch` → `this.props.mqlMatch`

- [ ] **Step 3: Update PlayerContainer spec**

`src/containers/PlayerContainer.spec.tsx` mocks `useMediaById` etc. Confirm the new props don't break the existing assertions. The spec injects a mocked `PlayerControls` that reads `props.collection.rows`; it doesn't touch the new props, so it should still pass. Run:

```bash
npm test -- --run src/containers/PlayerContainer.spec.tsx 2>&1 | tail -5
```
Expected: 4 tests pass.

- [ ] **Step 4: Verify typecheck and full tests**

```bash
npx tsc --noEmit
npm test -- --run 2>&1 | tail -5
```
Expected: silent tsc; `218 passed | 1 skipped`.

- [ ] **Step 5: Commit**

```bash
git add src/containers/PlayerContainer.tsx src/components/Player/PlayerControls.tsx
git commit -m "refactor(ui): move PlayerControls' app reads to discrete props

PlayerContainer pulls showVisuals/showSpectrum/mqlMatch from useUIStore
and passes them through. Drops the AppState dependency."
```

---

## Task 9: Migrate remaining dispatchers

**Files:**
- Modify: `src/components/Buttons/AddNewMediaButton.tsx`
- Modify: `src/components/Buttons/ToggleMiniQueueButton.tsx`
- Modify: `src/components/Dashboard/index.tsx`
- Modify: `src/pages/JoinRoom.ts`
- Modify: `src/pages/Social.tsx`
- Modify: `src/components/ArtistView/index.tsx`

These dispatch `SHOW_ADD_MEDIA_MODAL`, `TOGGLE_MINI_QUEUE`, `TOGGLE_RIGHT_PANEL`, `SET_BACKGROUND_IMAGE`. After migration, every one becomes a direct uiStore action call.

- [ ] **Step 1: AddNewMediaButton — show modal via uiStore**

`src/components/Buttons/AddNewMediaButton.tsx` line 16. Replace:

```tsx
const dispatch = useDispatch()
const openModal = () => {
  dispatch({ type: types.SHOW_ADD_MEDIA_MODAL })
}
```

with:

```tsx
const setShowAddMediaModal = useUIStore((s) => s.setShowAddMediaModal)
const openModal = () => setShowAddMediaModal(true)
```

Add `import { useUIStore } from '../../stores/uiStore'`. Remove now-unused imports.

- [ ] **Step 2: ToggleMiniQueueButton**

`src/components/Buttons/ToggleMiniQueueButton.tsx` line 10. Replace dispatch with `useUIStore((s) => s.toggleMiniQueue)()`.

- [ ] **Step 3: Dashboard**

`src/components/Dashboard/index.tsx` lines 67–68. Both onClick and onKeyDown dispatch `SHOW_ADD_MEDIA_MODAL`. Pull `setShowAddMediaModal` from uiStore at top and replace both inline dispatches.

- [ ] **Step 4: JoinRoom**

`src/pages/JoinRoom.ts` line 23 dispatches `TOGGLE_RIGHT_PANEL` with `value: true`. Replace with a direct uiStore call:

```ts
const { toggleRightPanel } = useUIStore.getState()
toggleRightPanel(true)
```

(JoinRoom.ts isn't a hook context — use `.getState()` for imperative access.)

- [ ] **Step 5: Social**

`src/pages/Social.tsx` line 48 dispatches `TOGGLE_RIGHT_PANEL`. Same pattern:

```tsx
const toggleRightPanel = useUIStore((s) => s.toggleRightPanel)
// …
const handleCloseRightPanel = () => toggleRightPanel()
```

- [ ] **Step 6: ArtistView**

`src/components/ArtistView/index.tsx` line 68 dispatches `SET_BACKGROUND_IMAGE`. Pull `setBackgroundImage` from uiStore:

```tsx
const setBackgroundImage = useUIStore((s) => s.setBackgroundImage)
// …
useEffect(() => {
  if (artist && backgroundImage) {
    dispatch({ type: types.FETCH_ARTIST_SONGS, artist })  // keep Redux for saga trigger
    setBackgroundImage(backgroundImage)                   // direct store write
  }
}, [artist, backgroundImage, dispatch, setBackgroundImage])
```

- [ ] **Step 7: Verify typecheck and tests**

```bash
npx tsc --noEmit
npm test -- --run 2>&1 | tail -5
```
Expected: silent tsc; `218 passed | 1 skipped`.

- [ ] **Step 8: Commit**

```bash
git add src/components/Buttons src/components/Dashboard src/pages/JoinRoom.ts src/pages/Social.tsx src/components/ArtistView/index.tsx
git commit -m "refactor(ui): migrate remaining dispatchers to useUIStore"
```

---

## Task 10: Migrate sagas (player) to write uiStore directly

**Files:**
- Modify: `src/sagas/player/commands.ts`
- Modify: `src/sagas/player/index.ts`

Sagas put `SET_BACKGROUND_IMAGE` (commands.ts:89, index.ts:127) and `TOGGLE_SIDEBAR` (index.ts:246). After the migration these actions go nowhere — the app reducer is gone, the middleware is gone. Replace with imperative uiStore writes.

- [ ] **Step 1: commands.ts**

In `src/sagas/player/commands.ts` around line 89:

```ts
// Before:
if (fullUrl) {
  yield put({ type: types.SET_BACKGROUND_IMAGE, backgroundImage: fullUrl })
}

// After:
if (fullUrl) {
  yield call(() => useUIStore.getState().setBackgroundImage(fullUrl))
}
```

Add `import { useUIStore } from '../../stores/uiStore'` to the file.

- [ ] **Step 2: index.ts background image dispatch**

Same pattern at `src/sagas/player/index.ts:127`. Replace the put with the imperative call.

- [ ] **Step 3: index.ts fullscreen sidebar toggle**

`src/sagas/player/index.ts:246` puts `TOGGLE_SIDEBAR`. Replace:

```ts
// Before:
if (player.fullscreen) {
  yield put({ type: types.TOGGLE_SIDEBAR, value: false })
  yield screenfull.request()
}

// After:
if (player.fullscreen) {
  yield call(() => useUIStore.getState().toggleSidebar(false))
  yield screenfull.request()
}
```

- [ ] **Step 4: Verify typecheck and tests**

```bash
npx tsc --noEmit
npm test -- --run src/sagas/player 2>&1 | tail -10
npm test -- --run 2>&1 | tail -5
```
Expected: silent tsc; player sagas pass (existing `setCurrentPlaying > works` test in `index.spec.ts`); full suite `218 passed | 1 skipped`.

- [ ] **Step 5: Commit**

```bash
git add src/sagas/player
git commit -m "refactor(ui): sagas write uiStore directly instead of dispatching"
```

---

## Task 11: Initialise MQL + ready state from store creation

**Files:**
- Modify: `src/store/configureStore.ts`
- Modify: `src/App.tsx`

`configureStore.ts:85-92` dispatches `SET_MQL`, `SET_HEIGHT_MQL` and adds listeners that re-dispatch on change. After this stage those dispatches go nowhere. Replace with direct uiStore writes. The `APP_READY` action (dispatched somewhere in App.tsx) needs the same treatment.

- [ ] **Step 1: configureStore — direct uiStore writes for MQL**

In `src/store/configureStore.ts` replace lines 85-92:

```ts
// Before:
store.dispatch({ type: types.SET_MQL, value: mql.matches });
store.dispatch({ type: types.SET_HEIGHT_MQL, value: heightMql.matches });
mql.addListener(() => {
  store.dispatch({ type: types.SET_MQL, value: mql.matches });
});
heightMql.addListener(() => {
  store.dispatch({ type: types.SET_HEIGHT_MQL, value: heightMql.matches });
});

// After:
import { useUIStore } from "../stores/uiStore";  // add to imports
// …
useUIStore.getState().setMqlMatch(mql.matches);
useUIStore.getState().setHeightMqlMatch(heightMql.matches);
mql.addListener(() => {
  useUIStore.getState().setMqlMatch(mql.matches);
});
heightMql.addListener(() => {
  useUIStore.getState().setHeightMqlMatch(heightMql.matches);
});
```

- [ ] **Step 2: App.tsx — locate APP_READY dispatch**

Run: `grep -n 'APP_READY' src/App.tsx`
Expected: zero or one hit. If a dispatch exists, replace with `useUIStore.getState().setReady(true)`. If `INITIALIZE` dispatch exists, leave it (still drives sagas).

If `INITIALIZED` is dispatched somewhere as an action consumed by the saga to flip uiStore.loading: replace its UI-side effect (`store.setLoading(false)` in uiSync) by adding `useUIStore.getState().setLoading(false)` at the end of the saga that handled `INITIALIZED` (likely `src/sagas/collection/watchers.ts` initializeWatcher). Confirm via:

```bash
grep -n 'INITIALIZED' src/sagas
```

In `initializeWatcher`, where it puts `{ type: types.INITIALIZED }`, also call `useUIStore.getState().setLoading(false)` immediately before.

- [ ] **Step 3: Verify typecheck and tests**

```bash
npx tsc --noEmit
npm test -- --run 2>&1 | tail -5
```
Expected: silent tsc; `218 passed | 1 skipped`.

- [ ] **Step 4: Commit**

```bash
git add src/store/configureStore.ts src/App.tsx src/sagas/collection/watchers.ts
git commit -m "refactor(ui): bootstrap uiStore directly from store init + saga"
```

---

## Task 12: Delete uiSyncMiddleware

**Files:**
- Delete: `src/middleware/uiSync.ts`
- Modify: `src/store/configureStore.ts`

By now every UI action either writes uiStore directly (components, sagas) or has no effect on UI state. The middleware exists to no purpose.

- [ ] **Step 1: Drop middleware import and wiring**

In `src/store/configureStore.ts`:

```ts
// Remove this import:
import { uiSyncMiddleware } from "../middleware/uiSync";

// Remove from the middlewares array:
uiSyncMiddleware, // Syncs Redux app actions → Zustand UI store
```

- [ ] **Step 2: Delete the file**

```bash
rm src/middleware/uiSync.ts
```

- [ ] **Step 3: Verify typecheck and tests**

```bash
npx tsc --noEmit
npm test -- --run 2>&1 | tail -5
```
Expected: silent tsc; `218 passed | 1 skipped`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete uiSyncMiddleware

Every UI action now writes useUIStore directly. The Redux->Zustand
bridge has no callers."
```

---

## Task 13: Delete app reducer

**Files:**
- Delete: `src/reducers/app.ts`
- Delete: `src/reducers/app.spec.ts` (if it exists)
- Modify: `src/reducers/index.ts`
- Modify: `src/test-utils/store.ts`

- [ ] **Step 1: Verify no remaining readers**

```bash
grep -rn 'state\.app\|reducers/app\|AppState' src/ --include='*.ts' --include='*.tsx' | grep -v reducers/app.ts
```
Expected: zero hits. If any remain, migrate that file first (likely a missed reader from earlier tasks).

- [ ] **Step 2: Remove app from reducers/index.ts**

Edit `src/reducers/index.ts` to drop the `app` reducer and `AppState` type entirely:

```ts
import { i18nReducer } from 'react-redux-i18n'
import { State as PlayerState } from './player'

import artist, { State as ArtistState } from './artist'
import player from './player'
import collection, { State as CollectionState } from './collection'
import search, { State as SearchState } from './search'
import peers, { State as PeerState } from "./peers";
import rooms, { State as RoomsState } from "./rooms";

export type State = {
  artist: ArtistState
  collection: CollectionState
  player: PlayerState
  search: SearchState
  peers: PeerState
  rooms: RoomsState
}

const reducers = {
  artist,
  collection,
  player,
  search,
  peers,
  i18n: i18nReducer,
  rooms,
};

export default reducers
```

- [ ] **Step 3: Remove app from test-utils/store.ts**

Delete the `app` import and the `app:` line in `createDefaultState()`.

- [ ] **Step 4: Delete the files**

```bash
rm src/reducers/app.ts
# Only if it exists:
test -f src/reducers/app.spec.ts && rm src/reducers/app.spec.ts
```

- [ ] **Step 5: Verify typecheck and tests**

```bash
npx tsc --noEmit
npm test -- --run 2>&1 | tail -5
```
Expected: silent tsc; tests pass (count may drop by 1–N if `app.spec.ts` existed).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: delete Redux app reducer

All UI state now lives in useUIStore. The app reducer had zero readers."
```

---

## Task 14: Sweep dead UI action types

**Files:**
- Modify: `src/constants/ActionTypes.ts`

After Task 13 the following constants have zero dispatchers AND zero handlers:

- `TOGGLE_SIDEBAR`
- `TOGGLE_RIGHT_PANEL`
- `TOGGLE_MINI_QUEUE`
- `TOGGLE_SEARCH`
- `TOGGLE_SEARCH_OFF`
- `TOGGLE_SPECTRUM`
- `TOGGLE_VISUALS`
- `SHOW_ADD_MEDIA_MODAL`
- `HIDE_ADD_MEDIA_MODAL`
- `SET_MQL`
- `SET_HEIGHT_MQL`
- `SET_BACKGROUND_IMAGE`
- `APP_READY`

`INITIALIZE` and `INITIALIZED` are still used (saga trigger). Leave them.

- [ ] **Step 1: Verify zero dispatchers per constant**

```bash
for sym in TOGGLE_SIDEBAR TOGGLE_RIGHT_PANEL TOGGLE_MINI_QUEUE TOGGLE_SEARCH TOGGLE_SEARCH_OFF TOGGLE_SPECTRUM TOGGLE_VISUALS SHOW_ADD_MEDIA_MODAL HIDE_ADD_MEDIA_MODAL SET_MQL SET_HEIGHT_MQL SET_BACKGROUND_IMAGE APP_READY; do
  hits=$(grep -rn "$sym" src/ --include='*.ts' --include='*.tsx' | grep -v 'ActionTypes.ts' | wc -l)
  printf '%-30s %s\n' "$sym" "$hits"
done
```
Expected: every line shows `0`. If any line shows >0, do not delete that constant; migrate the remaining usage first.

- [ ] **Step 2: Delete the constants**

Edit `src/constants/ActionTypes.ts`. Remove the 13 const exports listed above. Group comments (`// App`, `// Search`, etc.) can be kept or trimmed.

- [ ] **Step 3: Verify typecheck and tests**

```bash
npx tsc --noEmit
npm test -- --run 2>&1 | tail -5
```
Expected: silent tsc; tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/constants/ActionTypes.ts
git commit -m "chore: drop UI action types with no dispatchers"
```

---

## Task 15: Trim search reducer (remove migrated cases)

**Files:**
- Modify: `src/reducers/search.ts`
- Modify: `src/reducers/search.spec.ts` (if cases removed)

Reducer cases for `SET_SEARCH_TERM`, `TOGGLE_SEARCH`, `TOGGLE_SEARCH_OFF` are now dead. Cases for `START_SEARCH`, `SEARCH_REJECTED`, `SEARCH_FINISHED`, `SET_SEARCH_RESULTS` stay — the search saga still dispatches them and Topbar reads `loading` from this reducer.

- [ ] **Step 1: Trim cases**

Edit `src/reducers/search.ts`. Remove `SET_SEARCH_TERM`, `TOGGLE_SEARCH`, `TOGGLE_SEARCH_OFF` cases and the unused `searchTerm` and `searchToggled` fields from `State` and `defaultState`. Updated file:

```ts
import * as types from "../constants/ActionTypes";
import { StartSearchAction } from "../types/search";

export type State = {
  error: string;
  loading: boolean;
  searchResults: string[];
};

export const defaultState = {
  error: "",
  loading: false,
  searchResults: [],
};

interface SearchActionFields {
  type: string;
  searchType?: string;
  noRedirect?: boolean;
  searchResults?: string[];
  message?: string;
  data?: Array<{ id: string }>;
}

type SearchAction = StartSearchAction | SearchActionFields;

export default (state: State = defaultState, action: SearchAction = { type: '' }) => {
  switch (action.type) {
    case types.SET_SEARCH_RESULTS: {
      return { ...state, searchResults: action.searchResults };
    }
    case types.START_SEARCH: {
      return { ...state, loading: true };
    }
    case types.SEARCH_REJECTED: {
      return { ...state, error: action.message, loading: false };
    }
    case types.SEARCH_FINISHED: {
      return {
        ...state,
        loading: false,
        error: '',
        searchResults: action.data ? action.data.map((item) => item.id) : [],
      };
    }
    default:
      return state;
  }
};
```

`START_SEARCH` no longer copies `searchTerm` into state — the search saga reads it from `useUIStore.getState().searchTerm` (which already happens via the `useUIStore` `searchTerm` field set by Topbar). Confirm before saving:

```bash
grep -n 'searchTerm' src/sagas/search
```

If the saga reads `searchTerm` from the action payload, leave the assignment in. If it pulls from uiStore, drop it. The plan assumes uiStore; verify and adjust.

- [ ] **Step 2: Update search.spec.ts if it asserts removed cases**

```bash
test -f src/reducers/search.spec.ts && grep -n 'SET_SEARCH_TERM\|TOGGLE_SEARCH\|TOGGLE_SEARCH_OFF' src/reducers/search.spec.ts
```
Expected: zero hits. If hits exist, delete those `it(...)` blocks.

- [ ] **Step 3: Drop the now-dead ActionTypes**

`SET_SEARCH_TERM`, `TOGGLE_SEARCH`, `TOGGLE_SEARCH_OFF` should now be unused.

```bash
for sym in SET_SEARCH_TERM TOGGLE_SEARCH TOGGLE_SEARCH_OFF; do
  hits=$(grep -rn "$sym" src/ --include='*.ts' --include='*.tsx' | grep -v 'ActionTypes.ts' | wc -l)
  printf '%-20s %s\n' "$sym" "$hits"
done
```
Expected: all zero. Remove those 3 constants from `ActionTypes.ts`.

- [ ] **Step 4: Verify typecheck and tests**

```bash
npx tsc --noEmit
npm test -- --run 2>&1 | tail -5
```
Expected: silent tsc; tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: trim search reducer; remove migrated search action types"
```

---

## Task 16: Final verification

- [ ] **Step 1: Full build**

```bash
npm run build 2>&1 | tail -10
```
Expected: `✓ built in <N>s`. No new TypeScript errors. Bundle size should drop by a few KB (reducer + middleware deleted).

- [ ] **Step 2: Lint (warning baseline)**

```bash
npm run lint 2>&1 | tail -10
```
Expected: same warnings as before Task 1 (pre-existing). No new warnings introduced.

- [ ] **Step 3: Smoke test in dev**

```bash
pkill -f 'vite dev' 2>/dev/null
nohup npm run dev -- --host 127.0.0.1 --port 4182 > /tmp/stage2.log 2>&1 &
sleep 4
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4182/
```
Expected: `200`. Open the browser, exercise: open/close right panel, toggle sidebar, open add-media modal, change visuals/spectrum toggles, search. Every toggle should still work; component re-renders correctly.

- [ ] **Step 4: Push and deploy**

```bash
git log --oneline ba14b9fd..HEAD  # show Stage 2 commits
git push github master
npm run build
# Deploy:
npx wrangler pages deploy ./dist --project-name=deplayer --branch=main
```

---

## Done definition

- `npx tsc --noEmit` silent.
- `npm test -- --run` passes (count may differ from 218 if specs were updated or deleted).
- `npm run build` succeeds.
- `src/reducers/app.ts` deleted.
- `src/middleware/uiSync.ts` deleted.
- `grep -rn 'state\.app' src/` returns zero non-test hits.
- `grep -rn 'TOGGLE_SIDEBAR\|TOGGLE_RIGHT_PANEL\|SET_BACKGROUND_IMAGE\|SET_MQL\|SET_HEIGHT_MQL\|APP_READY\|SHOW_ADD_MEDIA_MODAL\|HIDE_ADD_MEDIA_MODAL\|TOGGLE_SPECTRUM\|TOGGLE_VISUALS\|TOGGLE_MINI_QUEUE' src/` returns zero hits.
- All commits land on `master` in the order listed.
