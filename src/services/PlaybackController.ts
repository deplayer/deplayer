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
  private initialized = false

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
    if (this.initialized && this.store === store) {
      return // Already initialized with this store
    }
    
    this.store = store
    this.createAudioElement()
    this.ensurePlaybackRow()
    this.initialized = true
    console.log('[PlaybackController] Initialized')
  }

  /**
   * Check if controller is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.store !== null && this.audioElement !== null
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
    this.audioElement.onerror = (e) => this.onAudioError(e as Event)
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
    if (!this.store || !this.audioElement) {
      console.warn('[PlaybackController] Not initialized')
      return
    }

    if (trackId) {
      // Play specific track
      await this.loadAndPlayTrack(trackId)
    } else {
      // Resume current track
      const state = await this.getPlaybackState()
      if (state?.streamUri) {
        // If audio element doesn't have a src or has different src, reload
        if (!this.audioElement.src || this.audioElement.src !== state.streamUri) {
          this.audioElement.src = state.streamUri
          this.audioElement.currentTime = state.position
        }
        await this.audioElement.play()
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
    
    try {
      await this.audioElement.play()
      this.startProgressUpdates()
    } catch (error) {
      console.error('[PlaybackController] Error playing audio:', error)
    }
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
    if (!this.audioElement) return
    
    if (this.audioElement.paused) {
      await this.play()
    } else {
      this.pause()
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

    if (!queue) {
      console.warn('[PlaybackController] No queue found')
      return
    }

    // Parse track IDs
    let trackIds = queue.shuffle ? queue.randomTrackIds : queue.trackIds
    if (typeof trackIds === 'string') {
      try {
        trackIds = JSON.parse(trackIds)
      } catch {
        trackIds = []
      }
    }
    
    if (!trackIds || trackIds.length === 0) {
      console.warn('[PlaybackController] Queue is empty')
      return
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
        console.log('[PlaybackController] End of queue')
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

    // If we're more than 3 seconds in, restart current track
    if (this.audioElement && this.audioElement.currentTime > 3) {
      this.audioElement.currentTime = 0
      return
    }

    // Get queue state
    const queueQuery = queryDb(
      tables.queue.select().where('id', '=', 'default').limit(1)
    )
    const queueResult = await this.store.query(queueQuery)
    const queue = Array.isArray(queueResult) ? queueResult[0] : null

    if (!queue) {
      console.warn('[PlaybackController] No queue found')
      return
    }

    // Parse track IDs
    let trackIds = queue.shuffle ? queue.randomTrackIds : queue.trackIds
    if (typeof trackIds === 'string') {
      try {
        trackIds = JSON.parse(trackIds)
      } catch {
        trackIds = []
      }
    }
    
    if (!trackIds || trackIds.length === 0) {
      return
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
  async seek(seconds: number): Promise<void> {
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
      this.audioElement.volume = Math.max(0, Math.min(100, volume)) / 100
    }
    
    if (this.store) {
      await this.store.commit(
        events.playbackVolumeChanged({
          id: PLAYBACK_ID,
          volume: Math.max(0, Math.min(100, volume)),
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
    if (this.store && this.audioElement && !isNaN(this.audioElement.duration)) {
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
    this.initialized = false
  }
}

export default PlaybackController
