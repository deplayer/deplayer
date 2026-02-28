# Centralized Playback State Design

**Date:** 2026-02-26
**Status:** Approved

## Problem

Current architecture has multiple sources of truth for playback state:
- **Redux** stores `streamUri`, `playing`, `volume`, `duration`
- **LiveStore** stores `currentPlaying` (index), `trackIds`, `shuffle`, `repeat`
- **ReactPlayer** has its own internal audio element state

This causes:
1. Two songs playing simultaneously
2. UI showing different song than what's playing
3. Race conditions during state transitions
4. Components defensively handling inconsistent states
5. Orphaned audio elements when state gets out of sync

## Solution

**LiveStore as single source of truth** with clear separation between synced and local state.

## Architecture

### State Separation

| State | Storage | Syncs? | Reasoning |
|-------|---------|--------|-----------|
| Media library | LiveStore | ✅ Yes | Same songs available everywhere |
| Playlists | LiveStore | ✅ Yes | Create playlist on one device, use on another |
| Favorites | LiveStore | ✅ Yes | Preferences follow user |
| Settings | LiveStore | ✅ Yes | App preferences follow user |
| **Queue** | LiveStore | ❌ No | Each device has its own playback session |
| **Playback** | LiveStore | ❌ No | Device-specific (playing, position, volume) |

### Schema Changes

#### New `playback` Table (Local)

```typescript
playback: State.SQLite.table({
  name: 'playback',
  columns: {
    id: State.SQLite.text({ primaryKey: true }), // 'default'
    currentTrackId: State.SQLite.text({ nullable: true }),
    streamUri: State.SQLite.text({ nullable: true }),
    playing: State.SQLite.boolean({ default: false }),
    volume: State.SQLite.integer({ default: 80 }),
    duration: State.SQLite.real({ default: 0 }),
    position: State.SQLite.real({ default: 0 }),
    updatedAt: State.SQLite.integer({}),
  },
})
```

#### Queue Table Changes (Local)

Change queue events from `Events.synced()` to `Events.local()`:
- `queueUpdated` → local
- `queueShuffleToggled` → local
- `queueRepeatToggled` → local
- `queuePositionChanged` → local

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LiveStore LOCAL                           │
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │  queue              │  │  playback                   │   │
│  │  - trackIds         │  │  - currentTrackId           │   │
│  │  - shuffle          │  │  - streamUri                │   │
│  │  - repeat           │  │  - playing                  │   │
│  └─────────────────────┘  │  - volume, position         │   │
│                           └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   usePlayback() Hook                         │
│                                                              │
│  State:                    Controls:                         │
│  - currentTrack            - play(trackId?)                  │
│  - isPlaying               - pause()                         │
│  - volume                  - next()                          │
│  - position                - prev()                          │
│  - duration                - seek(seconds)                   │
│  - queue                   - setVolume(vol)                  │
│  - shuffle                 - toggleShuffle()                 │
│  - repeat                  - toggleRepeat()                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               PlaybackController (Singleton)                 │
│                                                              │
│  - Owns single <audio> element                              │
│  - Subscribes to LiveStore playback state                   │
│  - When streamUri changes → loads new audio                 │
│  - When playing changes → play/pause                        │
│  - Emits position updates → writes to LiveStore             │
│  - Handles errors, loading states                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Components                              │
│                                                              │
│  PlayerControls:  const { currentTrack, isPlaying, ... }    │
│                   = usePlayback()                            │
│                                                              │
│  MusicTable:      const { play } = usePlayback()            │
│                   onClick={() => play(songId)}               │
│                                                              │
│  (No more Redux dispatch for playback!)                      │
└─────────────────────────────────────────────────────────────┘
```

### PlaybackController Details

```typescript
class PlaybackController {
  private static instance: PlaybackController
  private audioElement: HTMLAudioElement
  private store: LiveStore
  
  // Singleton
  static getInstance(): PlaybackController
  
  // Initialize with LiveStore
  initialize(store: LiveStore): void
  
  // Subscribe to playback state changes
  private subscribeToState(): void
  
  // Core playback methods (update LiveStore, audio follows)
  async play(trackId?: string): Promise<void>
  pause(): void
  async next(): Promise<void>
  async prev(): Promise<void>
  seek(seconds: number): void
  setVolume(volume: number): void
  
  // Internal: sync audio element with state
  private syncAudioWithState(state: PlaybackState): void
  
  // Internal: emit progress updates
  private startProgressUpdates(): void
}
```

### usePlayback() Hook

```typescript
export function usePlayback() {
  const playback = useQuery(/* playback table */)
  const queue = useQuery(/* queue table */)
  const currentTrack = useMediaById(playback?.currentTrackId)
  const controller = PlaybackController.getInstance()
  
  return {
    // State
    currentTrack,
    isPlaying: playback?.playing ?? false,
    volume: playback?.volume ?? 80,
    position: playback?.position ?? 0,
    duration: playback?.duration ?? 0,
    
    // Queue state
    queue: queue?.trackIds ?? [],
    shuffle: queue?.shuffle ?? false,
    repeat: queue?.repeat ?? false,
    
    // Controls (delegate to controller)
    play: controller.play.bind(controller),
    pause: controller.pause.bind(controller),
    next: controller.next.bind(controller),
    prev: controller.prev.bind(controller),
    seek: controller.seek.bind(controller),
    setVolume: controller.setVolume.bind(controller),
    toggleShuffle: controller.toggleShuffle.bind(controller),
    toggleRepeat: controller.toggleRepeat.bind(controller),
  }
}
```

## Migration Plan

### Phase 1: Schema & Events
- [ ] Add `playback` table to schema
- [ ] Add playback events (local)
- [ ] Change queue events from synced to local
- [ ] Add materializers

### Phase 2: PlaybackController
- [ ] Create PlaybackController singleton
- [ ] Implement audio element management
- [ ] Implement LiveStore subscription
- [ ] Implement progress updates

### Phase 3: usePlayback() Hook
- [ ] Create usePlayback() hook
- [ ] Create playback action functions
- [ ] Test with simple component

### Phase 4: Migrate PlayerControls
- [ ] Replace ReactPlayer with PlaybackController's audio
- [ ] Use usePlayback() for all state
- [ ] Remove Redux player state dependencies

### Phase 5: Migrate Other Components
- [ ] MusicTable: use play() from usePlayback()
- [ ] ArtistView/Album: use play() from usePlayback()
- [ ] ContextualMenu: use controls from usePlayback()
- [ ] CommandBar: use controls from usePlayback()
- [ ] GlobalKeyHandlers: use controls from usePlayback()

### Phase 6: Cleanup
- [ ] Remove Redux player reducer
- [ ] Remove player sagas
- [ ] Remove old queue actions
- [ ] Update tests

## Benefits

1. **Single source of truth** - All playback state in LiveStore
2. **No race conditions** - Atomic LiveStore updates
3. **No orphaned audio** - Single audio element in controller
4. **Simpler components** - Just use `usePlayback()` hook
5. **Multi-device ready** - Clear synced vs local separation
6. **Testable** - Controller can be mocked in tests

## Multi-Device Behavior

- **Syncs:** Media library, playlists, favorites, settings
- **Local:** Queue, playback (each device independent)

**Scenario:**
1. Phone plays "Song A" in kitchen
2. Laptop plays "Song B" in office
3. Both work independently ✅
4. Add song to playlist on Phone → appears on Laptop ✅
