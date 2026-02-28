# Centralized Playback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace fragmented Redux/LiveStore playback state with a single LiveStore-based `usePlayback()` hook and `PlaybackController` singleton.

**Architecture:** LiveStore stores all playback state (local, not synced). PlaybackController singleton owns the audio element and syncs it with LiveStore state. Components use `usePlayback()` hook for all playback needs.

**Tech Stack:** LiveStore, React hooks, HTML5 Audio API

---

## Phase 1: Schema & Events

### Task 1: Add Playback Table Schema

**Files:**
- Modify: `src/stores/livestore/schema.ts`

**Step 1: Add playback table definition**

In `src/stores/livestore/schema.ts`, add after the `queue` table definition:

```typescript
// Playback state table (LOCAL - not synced across devices)
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
}),
```

**Step 2: Run build to verify schema compiles**

Run: `npm run build 2>&1 | grep -i error | head -5`
Expected: No errors

**Step 3: Commit**

```bash
git add src/stores/livestore/schema.ts
git commit -m "feat(playback): add playback table schema"
```

---

### Task 2: Add Playback Events

**Files:**
- Create: `src/stores/livestore/events/playback.ts`
- Modify: `src/stores/livestore/schema.ts`

**Step 1: Create playback events file**

Create `src/stores/livestore/events/playback.ts`:

```typescript
import { Events, Schema } from '@livestore/livestore'

/**
 * Playback Domain Events (LOCAL - not synced)
 * 
 * These events control the playback state on this device only.
 */
export const playbackEvents = {
  /**
   * Fired when playback state is updated (currentTrack, playing, etc.)
   */
  playbackUpdated: Events.local({
    name: 'v1.PlaybackUpdated',
    schema: Schema.Struct({
      id: Schema.String,
      currentTrackId: Schema.optional(Schema.String),
      streamUri: Schema.optional(Schema.String),
      playing: Schema.Boolean,
      volume: Schema.Number,
      duration: Schema.optional(Schema.Number),
      position: Schema.optional(Schema.Number),
    }),
  }),

  /**
   * Fired when play/pause state changes
   */
  playbackPlayingChanged: Events.local({
    name: 'v1.PlaybackPlayingChanged',
    schema: Schema.Struct({
      id: Schema.String,
      playing: Schema.Boolean,
    }),
  }),

  /**
   * Fired when volume changes
   */
  playbackVolumeChanged: Events.local({
    name: 'v1.PlaybackVolumeChanged',
    schema: Schema.Struct({
      id: Schema.String,
      volume: Schema.Number,
    }),
  }),

  /**
   * Fired when position changes (seek or progress update)
   */
  playbackPositionChanged: Events.local({
    name: 'v1.PlaybackPositionChanged',
    schema: Schema.Struct({
      id: Schema.String,
      position: Schema.Number,
    }),
  }),

  /**
   * Fired when a new track starts loading
   */
  playbackTrackChanged: Events.local({
    name: 'v1.PlaybackTrackChanged',
    schema: Schema.Struct({
      id: Schema.String,
      currentTrackId: Schema.String,
      streamUri: Schema.String,
      duration: Schema.optional(Schema.Number),
    }),
  }),

  /**
   * Fired when playback is stopped/cleared
   */
  playbackCleared: Events.local({
    name: 'v1.PlaybackCleared',
    schema: Schema.Struct({
      id: Schema.String,
    }),
  }),
}
```

**Step 2: Import playback events in schema.ts**

In `src/stores/livestore/schema.ts`, add import:

```typescript
import { playbackEvents } from './events/playback'
```

And add to events object:

```typescript
export const events = {
  ...settingsEvents,
  ...mediaEvents,
  ...playlistEvents,
  ...smartPlaylistEvents,
  ...queueEvents,
  ...favoriteEvents,
  ...lyricsEvents,
  ...playbackEvents,  // Add this line
}
```

**Step 3: Run build to verify**

Run: `npm run build 2>&1 | grep -i error | head -5`
Expected: No errors

**Step 4: Commit**

```bash
git add src/stores/livestore/events/playback.ts src/stores/livestore/schema.ts
git commit -m "feat(playback): add playback events"
```

---

### Task 3: Add Playback Materializers

**Files:**
- Modify: `src/stores/livestore/schema.ts`

**Step 1: Add playback materializers**

In `src/stores/livestore/schema.ts`, add in the `materializers` object:

```typescript
// Playback materializers
'v1.PlaybackUpdated': ({ id, currentTrackId, streamUri, playing, volume, duration, position }: any) => {
  const now = Date.now()
  return tables.playback
    .insert({
      id,
      currentTrackId: currentTrackId ?? null,
      streamUri: streamUri ?? null,
      playing,
      volume,
      duration: duration ?? 0,
      position: position ?? 0,
      updatedAt: now,
    })
    .onConflict('id', 'update', {
      currentTrackId: currentTrackId ?? null,
      streamUri: streamUri ?? null,
      playing,
      volume,
      duration: duration ?? 0,
      position: position ?? 0,
      updatedAt: now,
    })
},

'v1.PlaybackPlayingChanged': ({ id, playing }: any) => {
  const now = Date.now()
  return tables.playback
    .update({ playing, updatedAt: now })
    .where('id', '=', id)
},

'v1.PlaybackVolumeChanged': ({ id, volume }: any) => {
  const now = Date.now()
  return tables.playback
    .update({ volume, updatedAt: now })
    .where('id', '=', id)
},

'v1.PlaybackPositionChanged': ({ id, position }: any) => {
  const now = Date.now()
  return tables.playback
    .update({ position, updatedAt: now })
    .where('id', '=', id)
},

'v1.PlaybackTrackChanged': ({ id, currentTrackId, streamUri, duration }: any) => {
  const now = Date.now()
  return tables.playback
    .update({
      currentTrackId,
      streamUri,
      duration: duration ?? 0,
      position: 0,
      playing: true,
      updatedAt: now,
    })
    .where('id', '=', id)
},

'v1.PlaybackCleared': ({ id }: any) => {
  const now = Date.now()
  return tables.playback
    .update({
      currentTrackId: null,
      streamUri: null,
      playing: false,
      position: 0,
      duration: 0,
      updatedAt: now,
    })
    .where('id', '=', id)
},
```

**Step 2: Run build to verify**

Run: `npm run build 2>&1 | grep -i error | head -5`
Expected: No errors

**Step 3: Commit**

```bash
git add src/stores/livestore/schema.ts
git commit -m "feat(playback): add playback materializers"
```

---

## Phase 2: PlaybackController

### Task 4: Create PlaybackController Singleton

**Files:**
- Create: `src/services/PlaybackController.ts`

**Step 1: Create PlaybackController**

Create `src/services/PlaybackController.ts`:

```typescript
import type { Store as LiveStore } from '@livestore/livestore'
import { queryDb } from '@livestore/livestore'
import { tables, events } from '../stores/livestore/schema'
import { getStreamUri } from './Song/StreamUriService'

const PLAYBACK_ID = 'default'

interface PlaybackState {
  currentTrackId: string | null
  streamUri: string | null
  playing: boolean
  volume: number
  duration: number
  position: number
}

/**
 * PlaybackController - Singleton that manages audio playback
 * 
 * Single source of truth for audio playback. Owns the <audio> element
 * and syncs it with LiveStore playback state.
 */
class PlaybackController {
  private static instance: PlaybackController
  private audioElement: HTMLAudioElement | null = null
  private store: LiveStore | null = null
  private progressInterval: number | null = null
  private lastState: PlaybackState | null = null

  private constructor() {}

  static getInstance(): PlaybackController {
    if (!PlaybackController.instance) {
      PlaybackController.instance = new PlaybackController()
    }
    return PlaybackController.instance
  }

  /**
   * Initialize controller with LiveStore instance
   */
  initialize(store: LiveStore): void {
    this.store = store
    this.createAudioElement()
    this.ensurePlaybackRow()
  }

  /**
   * Get the audio element (for visualizers, etc.)
   */
  getAudioElement(): HTMLAudioElement | null {
    return this.audioElement
  }

  /**
   * Create and configure the audio element
   */
  private createAudioElement(): void {
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.src = ''
    }

    this.audioElement = new Audio()
    this.audioElement.crossOrigin = 'anonymous'
    
    // Event handlers
    this.audioElement.onplay = () => this.onAudioPlay()
    this.audioElement.onpause = () => this.onAudioPause()
    this.audioElement.onended = () => this.onAudioEnded()
    this.audioElement.ondurationchange = () => this.onDurationChange()
    this.audioElement.onerror = (e) => this.onAudioError(e)
    this.audioElement.onloadeddata = () => this.onLoadedData()
  }

  /**
   * Ensure playback row exists in LiveStore
   */
  private async ensurePlaybackRow(): Promise<void> {
    if (!this.store) return

    const state = await this.getPlaybackState()
    if (!state) {
      await this.store.commit(
        events.playbackUpdated({
          id: PLAYBACK_ID,
          currentTrackId: undefined,
          streamUri: undefined,
          playing: false,
          volume: 80,
          duration: 0,
          position: 0,
        })
      )
    }
  }

  /**
   * Get current playback state from LiveStore
   */
  async getPlaybackState(): Promise<PlaybackState | null> {
    if (!this.store) return null

    try {
      const query = queryDb(
        tables.playback.select().where('id', '=', PLAYBACK_ID).limit(1)
      )
      const result = await this.store.query(query)
      const row = Array.isArray(result) ? result[0] : null
      
      if (!row) return null

      return {
        currentTrackId: row.currentTrackId,
        streamUri: row.streamUri,
        playing: Boolean(row.playing),
        volume: row.volume ?? 80,
        duration: row.duration ?? 0,
        position: row.position ?? 0,
      }
    } catch (error) {
      console.error('[PlaybackController] Error getting state:', error)
      return null
    }
  }

  /**
   * Play a track by ID
   */
  async play(trackId?: string): Promise<void> {
    if (!this.store || !this.audioElement) return

    if (trackId) {
      // Play specific track
      await this.loadAndPlayTrack(trackId)
    } else {
      // Resume current track
      const state = await this.getPlaybackState()
      if (state?.streamUri) {
        this.audioElement.play()
      }
    }
  }

  /**
   * Load and play a specific track
   */
  private async loadAndPlayTrack(trackId: string): Promise<void> {
    if (!this.store || !this.audioElement) return

    // Stop current playback
    this.audioElement.pause()
    this.stopProgressUpdates()

    // Get media info from LiveStore
    const mediaQuery = queryDb(
      tables.media.select().where('id', '=', trackId).limit(1)
    )
    const mediaResult = await this.store.query(mediaQuery)
    const media = Array.isArray(mediaResult) ? mediaResult[0] : null

    if (!media) {
      console.warn('[PlaybackController] Track not found:', trackId)
      return
    }

    // Parse stream data if needed
    let stream = media.stream
    if (typeof stream === 'string') {
      try {
        stream = JSON.parse(stream)
      } catch {
        stream = {}
      }
    }

    // Get stream URI
    const streamUri = await getStreamUri({ ...media, stream }, 0)
    if (!streamUri) {
      console.warn('[PlaybackController] No stream URI for track:', trackId)
      return
    }

    // Update LiveStore
    await this.store.commit(
      events.playbackTrackChanged({
        id: PLAYBACK_ID,
        currentTrackId: trackId,
        streamUri: String(streamUri),
        duration: media.duration ?? undefined,
      })
    )

    // Load and play audio
    this.audioElement.src = String(streamUri)
    this.audioElement.load()
    await this.audioElement.play()
    
    this.startProgressUpdates()
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause()
    }
  }

  /**
   * Toggle play/pause
   */
  async toggle(): Promise<void> {
    const state = await this.getPlaybackState()
    if (state?.playing) {
      this.pause()
    } else {
      await this.play()
    }
  }

  /**
   * Play next track in queue
   */
  async next(): Promise<void> {
    if (!this.store) return

    // Get queue state
    const queueQuery = queryDb(
      tables.queue.select().where('id', '=', 'default').limit(1)
    )
    const queueResult = await this.store.query(queueQuery)
    const queue = Array.isArray(queueResult) ? queueResult[0] : null

    if (!queue) return

    // Parse track IDs
    let trackIds = queue.shuffle ? queue.randomTrackIds : queue.trackIds
    if (typeof trackIds === 'string') {
      trackIds = JSON.parse(trackIds)
    }

    // Get current state
    const state = await this.getPlaybackState()
    const currentIndex = state?.currentTrackId 
      ? trackIds.indexOf(state.currentTrackId)
      : -1

    // Calculate next index
    let nextIndex = currentIndex + 1
    if (nextIndex >= trackIds.length) {
      if (queue.repeat) {
        nextIndex = 0
      } else {
        return // End of queue
      }
    }

    const nextTrackId = trackIds[nextIndex]
    if (nextTrackId) {
      await this.play(nextTrackId)
    }
  }

  /**
   * Play previous track in queue
   */
  async prev(): Promise<void> {
    if (!this.store) return

    // Get queue state
    const queueQuery = queryDb(
      tables.queue.select().where('id', '=', 'default').limit(1)
    )
    const queueResult = await this.store.query(queueQuery)
    const queue = Array.isArray(queueResult) ? queueResult[0] : null

    if (!queue) return

    // Parse track IDs
    let trackIds = queue.shuffle ? queue.randomTrackIds : queue.trackIds
    if (typeof trackIds === 'string') {
      trackIds = JSON.parse(trackIds)
    }

    // Get current state
    const state = await this.getPlaybackState()
    const currentIndex = state?.currentTrackId 
      ? trackIds.indexOf(state.currentTrackId)
      : 0

    // Calculate prev index
    let prevIndex = currentIndex - 1
    if (prevIndex < 0) {
      if (queue.repeat) {
        prevIndex = trackIds.length - 1
      } else {
        prevIndex = 0
      }
    }

    const prevTrackId = trackIds[prevIndex]
    if (prevTrackId) {
      await this.play(prevTrackId)
    }
  }

  /**
   * Seek to position (seconds)
   */
  async seek(seconds: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = seconds
      
      if (this.store) {
        await this.store.commit(
          events.playbackPositionChanged({
            id: PLAYBACK_ID,
            position: seconds,
          })
        )
      }
    }
  }

  /**
   * Set volume (0-100)
   */
  async setVolume(volume: number): Promise<void> {
    if (this.audioElement) {
      this.audioElement.volume = volume / 100
    }
    
    if (this.store) {
      await this.store.commit(
        events.playbackVolumeChanged({
          id: PLAYBACK_ID,
          volume,
        })
      )
    }
  }

  // Audio event handlers
  private async onAudioPlay(): Promise<void> {
    if (this.store) {
      await this.store.commit(
        events.playbackPlayingChanged({
          id: PLAYBACK_ID,
          playing: true,
        })
      )
    }
    this.startProgressUpdates()
  }

  private async onAudioPause(): Promise<void> {
    if (this.store) {
      await this.store.commit(
        events.playbackPlayingChanged({
          id: PLAYBACK_ID,
          playing: false,
        })
      )
    }
    this.stopProgressUpdates()
  }

  private async onAudioEnded(): Promise<void> {
    this.stopProgressUpdates()
    await this.next()
  }

  private async onDurationChange(): Promise<void> {
    if (this.store && this.audioElement) {
      const state = await this.getPlaybackState()
      if (state) {
        await this.store.commit(
          events.playbackUpdated({
            id: PLAYBACK_ID,
            currentTrackId: state.currentTrackId ?? undefined,
            streamUri: state.streamUri ?? undefined,
            playing: state.playing,
            volume: state.volume,
            duration: this.audioElement.duration || 0,
            position: state.position,
          })
        )
      }
    }
  }

  private onLoadedData(): void {
    console.log('[PlaybackController] Audio loaded')
  }

  private onAudioError(e: Event): void {
    console.error('[PlaybackController] Audio error:', e)
  }

  // Progress updates
  private startProgressUpdates(): void {
    this.stopProgressUpdates()
    this.progressInterval = window.setInterval(() => {
      this.updateProgress()
    }, 1000)
  }

  private stopProgressUpdates(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }
  }

  private async updateProgress(): Promise<void> {
    if (this.store && this.audioElement && !this.audioElement.paused) {
      await this.store.commit(
        events.playbackPositionChanged({
          id: PLAYBACK_ID,
          position: this.audioElement.currentTime,
        })
      )
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopProgressUpdates()
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.src = ''
      this.audioElement = null
    }
  }
}

export default PlaybackController
```

**Step 2: Run build to verify**

Run: `npm run build 2>&1 | grep -i error | head -5`
Expected: No errors

**Step 3: Commit**

```bash
git add src/services/PlaybackController.ts
git commit -m "feat(playback): add PlaybackController singleton"
```

---

### Task 5: Create usePlayback Hook

**Files:**
- Create: `src/stores/livestore/hooks/usePlayback.ts`
- Modify: `src/stores/livestore/hooks/index.ts`

**Step 1: Create usePlayback hook**

Create `src/stores/livestore/hooks/usePlayback.ts`:

```typescript
import { useQuery } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { useCallback, useEffect } from 'react'
import { tables } from '../schema'
import { useMediaById } from './useMedia'
import PlaybackController from '../../../services/PlaybackController'
import { useStore } from '@livestore/react'

/**
 * usePlayback - Central hook for all playback needs
 * 
 * Provides:
 * - Current playback state (track, playing, volume, position)
 * - Queue state (tracks, shuffle, repeat)
 * - Control functions (play, pause, next, prev, seek, setVolume)
 */
export function usePlayback() {
  const { store } = useStore()
  
  // Initialize controller with store
  useEffect(() => {
    if (store) {
      PlaybackController.getInstance().initialize(store)
    }
  }, [store])

  // Get playback state from LiveStore
  const playbackResult = useQuery(
    queryDb(
      tables.playback
        .select()
        .where('id', '=', 'default')
        .limit(1)
    )
  )
  const playback = (playbackResult as any[])?.[0] || null

  // Get queue state from LiveStore
  const queueResult = useQuery(
    queryDb(
      tables.queue
        .select()
        .where('id', '=', 'default')
        .limit(1)
    )
  )
  const queue = (queueResult as any[])?.[0] || null

  // Get current track info
  const currentTrack = useMediaById(playback?.currentTrackId || undefined)

  // Parse queue track IDs
  const parseTrackIds = (ids: any): string[] => {
    if (!ids) return []
    if (Array.isArray(ids)) return ids
    try {
      return JSON.parse(ids)
    } catch {
      return []
    }
  }

  const trackIds = queue?.shuffle
    ? parseTrackIds(queue.randomTrackIds)
    : parseTrackIds(queue?.trackIds)

  // Controller instance
  const controller = PlaybackController.getInstance()

  // Control functions
  const play = useCallback((trackId?: string) => {
    return controller.play(trackId)
  }, [controller])

  const pause = useCallback(() => {
    controller.pause()
  }, [controller])

  const toggle = useCallback(() => {
    return controller.toggle()
  }, [controller])

  const next = useCallback(() => {
    return controller.next()
  }, [controller])

  const prev = useCallback(() => {
    return controller.prev()
  }, [controller])

  const seek = useCallback((seconds: number) => {
    return controller.seek(seconds)
  }, [controller])

  const setVolume = useCallback((volume: number) => {
    return controller.setVolume(volume)
  }, [controller])

  return {
    // Playback state
    currentTrack,
    currentTrackId: playback?.currentTrackId || null,
    streamUri: playback?.streamUri || null,
    isPlaying: playback?.playing ?? false,
    volume: playback?.volume ?? 80,
    position: playback?.position ?? 0,
    duration: playback?.duration ?? 0,

    // Queue state
    queue: trackIds,
    queueIndex: currentTrack ? trackIds.indexOf(playback?.currentTrackId) : -1,
    shuffle: queue?.shuffle ?? false,
    repeat: queue?.repeat ?? false,

    // Controls
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    setVolume,

    // Audio element (for visualizers)
    audioElement: controller.getAudioElement(),
  }
}
```

**Step 2: Export from hooks index**

In `src/stores/livestore/hooks/index.ts`, add:

```typescript
// Playback hook
export { usePlayback } from './usePlayback'
```

**Step 3: Run build to verify**

Run: `npm run build 2>&1 | grep -i error | head -5`
Expected: No errors

**Step 4: Commit**

```bash
git add src/stores/livestore/hooks/usePlayback.ts src/stores/livestore/hooks/index.ts
git commit -m "feat(playback): add usePlayback hook"
```

---

## Phase 3: Migrate Components

### Task 6: Initialize PlaybackController in App

**Files:**
- Modify: `src/App.tsx`

**Step 1: Initialize controller after LiveStore is ready**

In `src/App.tsx`, in the `AppContent` component's useEffect where LiveStore is initialized, add:

```typescript
import PlaybackController from './services/PlaybackController'

// In the useEffect where liveStore is set:
React.useEffect(() => {
  if (liveStore) {
    setLiveStoreInstance(liveStore)
    liveStoreInstance = liveStore
    
    // Initialize PlaybackController
    PlaybackController.getInstance().initialize(liveStore)
    
    store.dispatch({ type: 'INITIALIZE' })
  }
}, [liveStore])
```

**Step 2: Run build to verify**

Run: `npm run build 2>&1 | grep -i error | head -5`
Expected: No errors

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(playback): initialize PlaybackController in App"
```

---

### Task 7: Create Simple Test Component

**Files:**
- Create: `src/components/PlaybackTest.tsx`

**Step 1: Create test component**

Create `src/components/PlaybackTest.tsx`:

```typescript
import { usePlayback } from '../stores/livestore/hooks'

/**
 * Simple component to test usePlayback hook
 * Remove after migration is complete
 */
export function PlaybackTest() {
  const {
    currentTrack,
    isPlaying,
    volume,
    position,
    duration,
    play,
    pause,
    toggle,
    next,
    prev,
    setVolume,
  } = usePlayback()

  return (
    <div style={{ padding: 20, background: '#333', color: '#fff' }}>
      <h3>Playback Test</h3>
      <p>Track: {currentTrack?.title || 'None'}</p>
      <p>Playing: {isPlaying ? 'Yes' : 'No'}</p>
      <p>Position: {position.toFixed(1)}s / {duration.toFixed(1)}s</p>
      <p>Volume: {volume}</p>
      
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button onClick={prev}>Prev</button>
        <button onClick={toggle}>{isPlaying ? 'Pause' : 'Play'}</button>
        <button onClick={next}>Next</button>
      </div>
      
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        style={{ marginTop: 10, width: '100%' }}
      />
    </div>
  )
}
```

**Step 2: Temporarily add to App for testing**

This is for manual testing only. Add `<PlaybackTest />` somewhere visible in the app temporarily.

**Step 3: Commit**

```bash
git add src/components/PlaybackTest.tsx
git commit -m "feat(playback): add PlaybackTest component for testing"
```

---

## Remaining Tasks (Phase 4-6)

The following tasks should be completed after verifying Phase 1-3 works:

### Phase 4: Migrate PlayerControls
- Task 8: Replace ReactPlayer with PlaybackController audio
- Task 9: Use usePlayback() for all state in PlayerControls
- Task 10: Remove Redux player state dependencies from PlayerControls

### Phase 5: Migrate Other Components
- Task 11: MusicTable - use play() from usePlayback()
- Task 12: ArtistView/Album - use play() from usePlayback()
- Task 13: ContextualMenu - use controls from usePlayback()
- Task 14: CommandBar - use controls from usePlayback()
- Task 15: GlobalKeyHandlers - use controls from usePlayback()

### Phase 6: Cleanup
- Task 16: Remove Redux player reducer
- Task 17: Remove player sagas
- Task 18: Remove old queue position actions
- Task 19: Update/remove obsolete tests
- Task 20: Remove PlaybackTest component

---

## Verification Checklist

After each phase, verify:

- [ ] `npm run build` passes
- [ ] `npm run lint` passes (or has only pre-existing warnings)
- [ ] Manual test: Can play a song
- [ ] Manual test: Can pause/resume
- [ ] Manual test: Next/Prev work
- [ ] Manual test: Volume works
- [ ] Manual test: Seek works
- [ ] Manual test: Only ONE audio element plays at a time
- [ ] Manual test: Song changes update UI correctly
