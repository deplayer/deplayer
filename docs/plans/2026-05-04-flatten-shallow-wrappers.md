# Flatten Shallow Wrappers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove ~17 shallow wrapper files and migrate 5 components from `connect()` to hooks, reducing indirection with no behavioral change.

**Architecture:** Purely subtractive refactor. Delete unused files, inline trivial wrappers at their call sites, then mechanically convert remaining `connect()` HOCs to `useDispatch`/`useSelector` hooks.

**Tech Stack:** React 19, Redux, react-redux (connect → hooks migration), Vite, Vitest

---

### Task 1: Delete unused button files

**Files:**
- Delete: `src/components/Buttons/SettingsButton.tsx`
- Delete: `src/components/Buttons/SidebarButton.tsx`
- Delete: `src/components/Buttons/PlaylistButton.tsx`
- Delete: `src/components/Buttons/BackButton.tsx`
- Delete: `src/components/Buttons/CollectionButton.tsx`
- Delete: `src/components/Buttons/RightPanelButton.tsx`

**Step 1: Verify no importers exist**

Run: `grep -r "SettingsButton\|SidebarButton\|PlaylistButton\|BackButton\|CollectionButton\|RightPanelButton" src/ --include="*.tsx" --include="*.ts" -l`

Expected: No results (or only the files themselves).

**Step 2: Delete the files**

```bash
rm src/components/Buttons/SettingsButton.tsx
rm src/components/Buttons/SidebarButton.tsx
rm src/components/Buttons/PlaylistButton.tsx
rm src/components/Buttons/BackButton.tsx
rm src/components/Buttons/CollectionButton.tsx
rm src/components/Buttons/RightPanelButton.tsx
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Success

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete 6 unused button components"
```

---

### Task 2: Delete Auth stub and clean importer

**Files:**
- Delete: `src/components/Auth/index.tsx`
- Modify: `src/components/Dashboard/index.tsx`

**Step 1: Remove Auth import and usage from Dashboard**

In `src/components/Dashboard/index.tsx`:
- Remove `import Auth from '../Auth'`
- Remove the line `{showAuthModal && <Auth />}` (renders null anyway)
- Remove any `showAuthModal` state if it only serves Auth

**Step 2: Delete Auth**

```bash
rm -rf src/components/Auth/
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Success

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete Auth stub component (disabled during migration)"
```

---

### Task 3: Inline PlaylistsContainer

**Files:**
- Delete: `src/containers/PlaylistsContainer.ts`
- Modify: `src/App.tsx`

**Step 1: Update App.tsx**

Replace:
```tsx
import PlaylistsContainer from './containers/PlaylistsContainer'
```
With:
```tsx
import Playlists from './components/Playlists'
```

Replace usage:
```tsx
<Route path="/playlists" element={<PlaylistsContainer />} />
```
With:
```tsx
<Route path="/playlists" element={<Playlists />} />
```

Note: The Playlists component may expect `dispatch` from connect(). Check if it uses `dispatch` prop — if so, add `useDispatch` inside Playlists itself.

**Step 2: Delete container**

```bash
rm src/containers/PlaylistsContainer.ts
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Success

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove PlaylistsContainer, import Playlists directly"
```

---

### Task 4: Inline ContextMenuContainer

**Files:**
- Delete: `src/containers/ContextMenuContainer.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Player/ContextualMenu.tsx`

**Step 1: Update App.tsx**

Replace:
```tsx
import ContextMenuContainer from './containers/ContextMenuContainer'
```
With:
```tsx
import ContextualMenu from './components/Player/ContextualMenu'
```

Replace usage of `<ContextMenuContainer />` with:
```tsx
<div className="justify-end items-center flex">
  <ContextualMenu />
</div>
```

**Step 2: Add Redux state to ContextualMenu**

The container was passing `app`, `slim`, and `player` from Redux. Add `useSelector` inside ContextualMenu.tsx to read these directly:

```tsx
import { useSelector } from 'react-redux'

// Inside the component:
const app = useSelector((state: any) => state.app)
const slim = useSelector((state: any) => state.app.slimPlayer)
const player = useSelector((state: any) => state.player)
```

Remove those from the props type.

**Step 3: Delete container**

```bash
rm src/containers/ContextMenuContainer.tsx
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Success

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: inline ContextMenuContainer into ContextualMenu"
```

---

### Task 5: Inline Header component

**Files:**
- Delete: `src/components/common/Header/index.tsx`
- Modify: `src/components/SongView/Lyrics.tsx`

**Step 1: Replace usage in Lyrics.tsx**

Replace:
```tsx
import Header from '../common/Header'
```
Remove that import.

Replace `<Header>Lyrics</Header>` with `<h2>Lyrics</h2>`.

**Step 2: Delete Header**

```bash
rm -rf src/components/common/Header/
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Success

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: inline Header component as plain h2"
```

---

### Task 6: Inline NotFound → BodyMessage → CenteredMessage chain

These three form a chain: SongView → NotFound → BodyMessage → CenteredMessage. Collapse the whole chain.

**Files:**
- Delete: `src/components/NotFound.tsx`
- Delete: `src/components/BodyMessage.tsx`
- Modify: `src/components/SongView/index.tsx`
- Keep: `src/components/common/CenteredMessage/index.tsx` (still used by Settings.tsx)

**Step 1: Replace NotFound usage in SongView**

In `src/components/SongView/index.tsx`, replace:
```tsx
import NotFound from '../NotFound'
```
Remove that import, add:
```tsx
import CenteredMessage from '../common/CenteredMessage'
```

Replace:
```tsx
<NotFound>The requested song can not be found</NotFound>
```
With:
```tsx
<CenteredMessage>
  <div className='text-center'>The requested song can not be found</div>
</CenteredMessage>
```

**Step 2: Delete NotFound and BodyMessage**

```bash
rm src/components/NotFound.tsx
rm src/components/BodyMessage.tsx
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Success

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: inline NotFound/BodyMessage chain, use CenteredMessage directly"
```

---

### Task 7: Inline DeplayerTitle

**Files:**
- Delete: `src/components/DeplayerTitle/index.tsx`
- Modify: `src/components/Dashboard/index.tsx`
- Modify: `src/components/Footer/index.tsx`
- Modify: `src/components/Sidebar/SidebarContents.tsx`

**Step 1: Replace in all 3 files**

Remove the import `import DeplayerTitle from '../DeplayerTitle'` and replace every `<DeplayerTitle />` with:

```tsx
<><span className='text-primary'>d</span><span className='text-base-content'>eplayer</span></>
```

**Step 2: Delete DeplayerTitle**

```bash
rm -rf src/components/DeplayerTitle/
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Success

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: inline DeplayerTitle as JSX fragment"
```

---

### Task 8: Inline PlayPauseButton and SkipButton

**Files:**
- Delete: `src/components/Player/PlayPauseButton.tsx`
- Delete: `src/components/Player/SkipButton.tsx`
- Modify: `src/components/Player/Controls.tsx`

**Step 1: Inline PlayPauseButton into Controls.tsx**

Replace `import PlayPauseButton from './PlayPauseButton'` — remove it.

Replace `<PlayPauseButton playing={props.isPlaying} onClick={props.playPause} />` with:

```tsx
<div className='hover:border-primary rounded-[var(--player-btn-radius)] border-[var(--player-btn-border)]'>
  <Button
    transparent
    inverted
    size='4xl'
    roundedFull
    className='hover:bg-secondary-content hover:text-secondary text-primary-content bg-secondary rounded-[var(--player-btn-radius)] border-[var(--player-btn-border)] mx-1 w-14 h-14 p-0'
    onClick={props.playPause}
  >
    {props.isPlaying ? <Icon icon='faPauseCircle' /> : <Icon icon='faPlayCircle' />}
  </Button>
</div>
```

**Step 2: Inline SkipButton into Controls.tsx**

Replace `import SkipButton from './SkipButton'` — remove it.

Replace both `<SkipButton type="prev" onClick={...} />` and `<SkipButton type="next" onClick={...} />` with:

```tsx
<div className='hover:border-primary p-1 bg-base-300 hover:bg-base-800 rounded-[var(--player-btn-radius)] border-[var(--player-btn-border)]'>
  <Button
    inverted
    transparent
    size='lg'
    className='w-12 h-10 bg-base-content/40 hover:bg-base-content/80 rounded-full hover:text-secondary-focus text-secondary'
    onClick={/* prev or next handler */}
  >
    <Icon icon='faStepBackward' /> {/* or faStepForward */}
  </Button>
</div>
```

Ensure `Button` and `Icon` are imported (they likely already are via the deleted files' imports).

**Step 3: Delete files**

```bash
rm src/components/Player/PlayPauseButton.tsx
rm src/components/Player/SkipButton.tsx
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Success

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: inline PlayPauseButton and SkipButton into Controls"
```

---

### Task 9: Migrate ToggleMiniQueueButton to hooks

**Files:**
- Modify: `src/components/Buttons/ToggleMiniQueueButton.tsx`

**Step 1: Rewrite with hooks**

```tsx
import { useDispatch } from 'react-redux'
import { I18n } from 'react-redux-i18n'

import { TOGGLE_MINI_QUEUE } from '../../constants/ActionTypes'
import Button from '../common/Button'
import Icon from '../common/Icon'

const ToggleMiniQueueButton = () => {
  const dispatch = useDispatch()

  const toggleMiniQueue = () => {
    dispatch({ type: TOGGLE_MINI_QUEUE })
  }

  return (
    <Button
      transparent
      onClick={toggleMiniQueue}
      title={I18n.t('buttons.toggleMiniQueue')}
    >
      <Icon
        icon='faEyeSlash'
        className='mx-2'
      />
    </Button>
  )
}

export default ToggleMiniQueueButton
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Success

**Step 3: Commit**

```bash
git add src/components/Buttons/ToggleMiniQueueButton.tsx
git commit -m "refactor: migrate ToggleMiniQueueButton from connect() to useDispatch"
```

---

### Task 10: Migrate AddNewMediaButton to hooks

**Files:**
- Modify: `src/components/Buttons/AddNewMediaButton.tsx`

**Step 1: Rewrite with hooks**

```tsx
import { Translate } from 'react-redux-i18n'
import { useDispatch } from 'react-redux'

import Button from '../common/Button'
import Icon from '../common/Icon'
import * as types from '../../constants/ActionTypes'

type Props = {
  fullWidth?: boolean
  label?: string
  className?: string
}

const AddNewMediaButton = (props: Props) => {
  const dispatch = useDispatch()

  const openModal = () => {
    dispatch({ type: types.SHOW_ADD_MEDIA_MODAL })
  }

  return (
    <Button
      onClick={openModal}
      fullWidth={props.fullWidth}
      className={`btn btn-secondary ${props.className || ''}`}
    >
      <Icon
        icon='faPlusCircle'
        className='mr-2'
      />
      {props.label || <Translate value='buttons.addNewMedia' />}
    </Button>
  )
}

export default AddNewMediaButton
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Success

**Step 3: Commit**

```bash
git add src/components/Buttons/AddNewMediaButton.tsx
git commit -m "refactor: migrate AddNewMediaButton from connect() to useDispatch"
```

---

### Task 11: Migrate SearchButton to hooks

**Files:**
- Modify: `src/components/Buttons/SearchButton.tsx`

**Step 1: Rewrite with hooks**

```tsx
import { useDispatch, useSelector } from 'react-redux'

import Button from '../common/Button'
import * as types from '../../constants/ActionTypes'
import Icon from '../common/Icon'

const SearchButton = () => {
  const dispatch = useDispatch()
  const searchToggled = useSelector((state: { search: any }) => state.search.searchToggled)

  const toggleSearch = () => {
    dispatch({ type: types.TOGGLE_SEARCH })
  }

  if (searchToggled) {
    return null
  }

  return (
    <Button
      inverted
      transparent
      onClick={toggleSearch}
    >
      <Icon icon='faSearch' />
    </Button>
  )
}

export default SearchButton
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Success

**Step 3: Commit**

```bash
git add src/components/Buttons/SearchButton.tsx
git commit -m "refactor: migrate SearchButton from connect() to useSelector/useDispatch"
```

---

### Task 12: Migrate RightPanelContainer to hooks

**Files:**
- Modify: `src/containers/RightPanelContainer.tsx`

**Step 1: Rewrite with hooks**

```tsx
import Sidebar from 'react-sidebar'
import { useDispatch, useSelector } from 'react-redux'
import { State as RootState } from '../reducers'
import Social from '../pages/Social'

const SidebarContents = () => {
  return <div className='w-full h-full'>
    <Social />
  </div>
}

const RightPanelContainer = () => {
  const dispatch = useDispatch()
  const rightPanelToggled = useSelector((state: RootState) => state.app.rightPanelToggled)

  const handleSetSidebarOpen = (open: boolean) => {
    dispatch({ type: 'TOGGLE_RIGHT_PANEL', value: open })
  }

  return (
    <Sidebar
      sidebar={<SidebarContents />}
      open={rightPanelToggled}
      pullRight={true}
      onSetOpen={handleSetSidebarOpen}
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

Note: Check if `Social` component expects a `dispatch` prop. If so, remove it from Social's props and add `useDispatch` inside Social.

**Step 2: Verify build**

Run: `npm run build`
Expected: Success

**Step 3: Commit**

```bash
git add src/containers/RightPanelContainer.tsx
git commit -m "refactor: migrate RightPanelContainer from connect() to hooks"
```

---

### Task 13: Migrate PlayerContainer to hooks

**Files:**
- Modify: `src/containers/PlayerContainer.tsx`

**Step 1: Read current PlayerContainer content and identify mapStateToProps**

The container maps Redux state (app, queue, player, settings) and passes to PlayerControls. Rewrite:

- Replace `connect(mapStateToProps)` with `useSelector` for each slice
- Replace `dispatch` prop with `useDispatch()`
- Keep the hooks it already uses (useQueue, useSettings, useMediaMapForIds)
- Export the component directly

**Step 2: Rewrite with hooks**

Replace the `connect()` wrapper pattern. Keep all existing hook calls. Move Redux state reads into `useSelector` calls inside the component body.

**Step 3: Verify build**

Run: `npm run build`
Expected: Success

**Step 4: Run tests**

Run: `npm run test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/containers/PlayerContainer.tsx
git commit -m "refactor: migrate PlayerContainer from connect() to hooks"
```

---

### Task 14: Final verification

**Step 1: Run knip to find dead exports**

Run: `npm run knip`
Expected: No new issues introduced (existing issues may show)

**Step 2: Full build**

Run: `npm run build`
Expected: Success with no type errors

**Step 3: Full test suite**

Run: `npm run test`
Expected: All tests pass

**Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: cleanup after wrapper flattening"
```
