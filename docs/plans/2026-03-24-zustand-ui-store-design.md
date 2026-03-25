# Replace UIContext with Zustand Store — Design

## Problem

`UIContext` stores all ephemeral UI state in a single `useState` object. Every setter creates a new object reference, causing all 14 consumers to re-render on any state change. This creates a "context stampede" — navigating sections triggers cascading re-renders of heavy components like `MusicTable`, `Collection`, and `ArtistTable`.

## Solution

Replace `UIContext` with a Zustand store (`useUIStore`). Consumers use selectors to subscribe to only the fields they need, eliminating unnecessary re-renders.

## Store Shape

Same fields as current `UIState` + actions. Consumed via selectors:

```ts
const loading = useUIStore(s => s.loading)
const mqlMatch = useUIStore(s => s.mqlMatch)
```

## Ownership Changes

- `loading`, `mqlMatch`, `heightMqlMatch` — owned by Zustand, set directly where events originate (sagas, media query listeners). Removed from Redux `app` reducer and the App.tsx bridge.
- `activeFilters`, `searchTerm` — owned by Zustand, read directly inside LiveStore hooks (`useCollectionData`, `useSearchMediaIds`). No longer passed as arguments.

## Migration Strategy

1. Install Zustand, create store with identical state/actions
2. Replace all 14 `useUI()` calls with selective `useUIStore(s => ...)`
3. Update LiveStore hooks to read from Zustand internally
4. Move `mqlMatch`/`loading`/`heightMqlMatch` ownership out of Redux
5. Delete `UIContext.tsx` and `UIProvider`

## What Stays the Same

- Redux stays for player, queue, settings, router
- LiveStore stays for persistent data
- Component APIs don't change — only the import source
