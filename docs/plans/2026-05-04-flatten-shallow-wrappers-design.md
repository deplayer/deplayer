# Flatten Shallow Wrappers

## Goal

Remove ~18 shallow wrapper files and standardize remaining button/container components on React hooks instead of `connect()`. No behavioral changes — purely subtractive refactor.

## Deletions

### Unused files (0 importers)

- `Buttons/SettingsButton.tsx`
- `Buttons/SidebarButton.tsx`
- `Buttons/PlaylistButton.tsx`
- `Buttons/BackButton.tsx`
- `Buttons/CollectionButton.tsx`
- `Buttons/RightPanelButton.tsx`
- `components/Auth/index.tsx`

### Trivial wrappers (inline at call site, then delete)

- `containers/PlaylistsContainer.ts` — no-op `connect()`, replace with direct import
- `containers/ContextMenuContainer.tsx` — classNames div, merge into ContextualMenu
- `common/Header/index.tsx` — returns `<h2>`, use element directly
- `common/CenteredMessage/index.tsx` — wraps Footer, inline
- `components/BodyMessage.tsx` — wraps CenteredMessage, inline
- `components/NotFound/index.tsx` — wraps BodyMessage, inline
- `components/DeplayerTitle/index.tsx` — styled span, inline

### Player micro-wrappers (inline into parent)

- `Player/PlayPauseButton.tsx`
- `Player/SkipButton.tsx`
- `Player/VolumeControl.tsx`

## Hook migration

Migrate `connect()` to `useDispatch`/`useSelector` hooks:

- `Buttons/ToggleMiniQueueButton.tsx`
- `Buttons/AddNewMediaButton.tsx`
- `Buttons/SearchButton.tsx`
- `containers/RightPanelContainer.tsx`
- `containers/PlayerContainer.tsx`

### Out of scope

These containers stay on `connect()` — too complex to migrate as standalone cleanup:

- `containers/LayoutContainer.tsx`
- `containers/TopbarContainer.tsx`
- `containers/SongContainer.tsx`

## Execution order

1. Delete unused files (7)
2. Inline trivial wrappers (7)
3. Inline player micro-wrappers (3)
4. Migrate connect() to hooks (5)
5. Run tests + build after each group

## Expected outcome

- ~18 fewer files
- One Redux pattern in buttons/simple containers (hooks)
- ~400 LOC removed, no behavioral change
