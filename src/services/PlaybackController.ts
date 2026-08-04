import type { Dispatch } from 'redux'
import type { MediaRow } from '../types/media'
import { queryDb, Store } from '@livestore/livestore'
import { tables } from '../stores/livestore/schema'
import {
  readQueue,
  playAllAction,
  addNextAction,
  playMediaAction,
  playNextAction,
  playPreviousAction,
} from '../stores/livestore/actions/queue'
import { rawToMediaRow } from '../stores/livestore/transformMedia'
import { resolveCurrentSongId } from '../stores/livestore/hooks/queueUtils'


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlaybackQueue = {
  trackIds: readonly string[]
  randomTrackIds: readonly string[]
  currentPlaying: number | null
  currentTrackId: string | null
  shuffle: boolean
  repeat: boolean
}

export type PlaybackResult =
  | { status: 'started'; songId: string; streamUri: string }
  | { status: 'idle'; reason: 'store-unavailable' | 'empty-queue' | 'end-of-queue' | 'missing-media' | 'missing-stream' }

export class PlaybackStoreUnavailableError extends Error {
  constructor() {
    super('LiveStore is not available')
  }
}

export interface PlaybackDataPort {
  readQueue(): Promise<PlaybackQueue | null>
  readMedia(songId: string): Promise<MediaRow | null>
  replaceQueue(trackIds: readonly string[]): Promise<void>
  addNext(trackIds: readonly string[]): Promise<void>
  select(songId: string): Promise<void>
  next(): Promise<void>
  previous(): Promise<void>
}

export interface PlaybackTransport {
  stop(): void
  play(): Promise<void>
  pause(): void
  toggle(): void
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

export class PlaybackController {
  private data: PlaybackDataPort
  private transport: PlaybackTransport
  private dispatch: Dispatch
  private setBackgroundImage: (url: string) => void
  private resolveStream: (media: MediaRow, providerIndex: number) => Promise<string | Blob>
  private objectUrl: string | null = null
  private currentSongId: string | null = null

  constructor(dependencies: {
    data: PlaybackDataPort
    transport: PlaybackTransport
    dispatch: Dispatch
    setBackgroundImage: (url: string) => void
    resolveStream?: (media: MediaRow, providerIndex: number) => Promise<string | Blob>
  }) {
    this.data = dependencies.data
    this.transport = dependencies.transport
    this.dispatch = dependencies.dispatch
    this.setBackgroundImage = dependencies.setBackgroundImage
    this.resolveStream = dependencies.resolveStream ?? defaultResolveStream
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  async playList(trackIds: readonly string[], startFromId?: string): Promise<PlaybackResult> {
    if (trackIds.length === 0) {
      return { status: 'idle', reason: 'empty-queue' }
    }

    try {
      // 1. Kill audio before touching the queue
      this.dispatch({ type: 'STOP_PLAYING' })
      this.transport.stop()

      // 2. Replace queue
      await this.data.replaceQueue(trackIds)

      // 3. Resolve target track
      const targetId = startFromId && trackIds.includes(startFromId)
        ? startFromId
        : trackIds[0]

      // If startFromId is not the first track, reposition
      if (startFromId && startFromId !== trackIds[0] && trackIds.includes(startFromId)) {
        await this.data.select(startFromId)
      }

      return this.startStream(targetId)
    } catch (error) {
      if (error instanceof PlaybackStoreUnavailableError) {
        return { status: 'idle', reason: 'store-unavailable' }
      }
      throw error
    }
  }

  async playSong(songId: string, contextIds?: readonly string[]): Promise<PlaybackResult> {
    if (!songId) {
      return { status: 'idle', reason: 'missing-media' }
    }

    try {
      // 1. Kill audio
      this.dispatch({ type: 'STOP_PLAYING' })
      this.transport.stop()

      // 2. Ensure song is in queue
      await this.ensureInQueue(songId, contextIds)

      // 3. Start stream
      return this.startStream(songId)
    } catch (error) {
      if (error instanceof PlaybackStoreUnavailableError) {
        return { status: 'idle', reason: 'store-unavailable' }
      }
      throw error
    }
  }

  async playCurrent(songId: string, options?: { media?: MediaRow; streamUri?: string }): Promise<PlaybackResult> {
    if (options?.streamUri) {
      // Explicit URL (peer/demo) — use directly, skip resolver
      this.revokeObjectUrl()
      this.currentSongId = songId
      this.dispatch({ type: 'PUSH_TO_VIEW', song: songId })
      this.dispatch({ type: 'SET_CURRENT_PLAYING_URL', url: options.streamUri })

      if (options.media) {
        this.dispatch({ type: 'SET_CURRENT_PLAYING_STREAMS', streams: options.media.stream })
      }

      this.dispatch({ type: 'SHOW_PLAYER' })

      await this.transport.play()

      if (options.media?.cover?.fullUrl) {
        this.setBackgroundImage(options.media.cover.fullUrl)
      }

      return { status: 'started', songId, streamUri: options.streamUri }
    }

    // Resolve stream from providers
    return this.startStreamWithMedia(songId, options?.media ?? null, 0)
  }

  async next(): Promise<PlaybackResult> {
    try {
      this.dispatch({ type: 'STOP_PLAYING' })
      this.transport.stop()

      await this.data.next()

      const queue = await this.data.readQueue()
      if (!queue) {
        return { status: 'idle', reason: 'store-unavailable' }
      }
      const songId = resolveCurrentSongId(queue)
      if (!songId) {
        return { status: 'idle', reason: 'end-of-queue' }
      }

      const result = await this.startStream(songId)
      if (result.status === 'idle' && result.reason !== 'store-unavailable') {
        return this.advanceFallback(songId, () => this.data.next())
      }
      return result
    } catch (error) {
      if (error instanceof PlaybackStoreUnavailableError) {
        return { status: 'idle', reason: 'store-unavailable' }
      }
      throw error
    }
  }

  async previous(): Promise<PlaybackResult> {
    try {
      this.dispatch({ type: 'STOP_PLAYING' })
      this.transport.stop()

      await this.data.previous()

      const queue = await this.data.readQueue()
      if (!queue) {
        return { status: 'idle', reason: 'store-unavailable' }
      }

      const songId = resolveCurrentSongId(queue)
      if (!songId) {
        return { status: 'idle', reason: 'end-of-queue' }
      }

      const result = await this.startStream(songId)
      if (result.status === 'idle' && result.reason !== 'store-unavailable') {
        return this.advanceFallback(songId, () => this.data.previous())
      }
      return result
    } catch (error) {
      if (error instanceof PlaybackStoreUnavailableError) {
        return { status: 'idle', reason: 'store-unavailable' }
      }
      throw error
    }
  }

  async retry(providerIndex: number): Promise<PlaybackResult> {
    const songId = this.currentSongId
    if (!songId) {
      return { status: 'idle', reason: 'missing-media' }
    }

    return this.startStream(songId, providerIndex)
  }

  async play(): Promise<void> {
    await this.transport.play()
  }

  pause(): void {
    this.transport.pause()
  }

  toggle(): void {
    this.transport.toggle()
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private async ensureInQueue(songId: string, contextIds?: readonly string[]): Promise<void> {
    const queue = await this.data.readQueue()

    if (!queue || queue.trackIds.length === 0) {
      // No queue — create one
      if (contextIds && contextIds.length > 0) {
        await this.data.replaceQueue(contextIds)
        const index = contextIds.indexOf(songId)
        if (index > 0) {
          await this.data.select(songId)
        }
      } else {
        await this.data.replaceQueue([songId])
      }
    } else {
      const index = queue.trackIds.indexOf(songId)
      if (index !== -1) {
        // Song in queue — reposition
        await this.data.select(songId)
      } else {
        // Song not in queue — add next, then play
        await this.data.addNext([songId])
        await this.data.select(songId)
      }
    }
  }

  private async startStream(songId: string, providerIndex = 0): Promise<PlaybackResult> {
    try {
      const media = await this.data.readMedia(songId)
      return this.startStreamWithMedia(songId, media, providerIndex)
    } catch (error) {
      if (error instanceof PlaybackStoreUnavailableError) {
        return { status: 'idle', reason: 'store-unavailable' }
      }
      throw error
    }
  }

  private async startStreamWithMedia(
    songId: string,
    media: MediaRow | null,
    providerIndex: number,
  ): Promise<PlaybackResult> {
    if (!media) {
      console.warn('[PlaybackController] Media not found:', songId)
      return { status: 'idle', reason: 'missing-media' }
    }

    let streamUri: string | Blob
    try {
      streamUri = await this.resolveStream(media, providerIndex)
    } catch (error) {
      console.error('[PlaybackController] Error resolving stream:', error)
      return { status: 'idle', reason: 'missing-stream' }
    }

    if (!streamUri) {
      console.warn('[PlaybackController] No stream URI for:', songId)
      return { status: 'idle', reason: 'missing-stream' }
    }

    // Convert Blob to object URL
    const url = typeof streamUri === 'string' ? streamUri : URL.createObjectURL(streamUri)
    if (streamUri instanceof Blob) {
      this.revokeObjectUrl()
      this.objectUrl = url as string
    }

    this.currentSongId = songId

    this.dispatch({ type: 'SET_CURRENT_PLAYING_URL', url })
    this.dispatch({ type: 'PUSH_TO_VIEW', song: songId })
    this.dispatch({ type: 'SET_CURRENT_PLAYING_STREAMS', streams: media.stream })
    this.dispatch({ type: 'SHOW_PLAYER' })
    // Imperative play — waits for ReactPlayer to mount the internal element.
    // Redux `playing` state will be set by ReactPlayer's onPlay callback.
    await this.transport.play()

    if (media.cover?.fullUrl) {
      this.setBackgroundImage(media.cover.fullUrl)
    }

    return { status: 'started', songId, streamUri: url }
  }

  /**
   * Advance the queue once more and try to resolve the next track.
   * Used as a fallback when the current track's media/stream is missing.
   * If the next track also fails, returns idle — no recursive retry.
   */
  private async advanceFallback(songId: string, advance: () => Promise<void>): Promise<PlaybackResult> {
    try {
      const beforeQueue = await this.data.readQueue()
      if (!beforeQueue) {
        return { status: 'idle', reason: 'store-unavailable' }
      }

      await advance()

      const afterQueue = await this.data.readQueue()
      if (!afterQueue) {
        return { status: 'idle', reason: 'store-unavailable' }
      }

      const nextId = resolveCurrentSongId(afterQueue)
      if (!nextId || nextId === songId) {
        return { status: 'idle', reason: 'missing-stream' }
      }

      const media = await this.data.readMedia(nextId)
      if (!media) {
        return { status: 'idle', reason: 'missing-stream' }
      }

      return this.startStreamWithMedia(nextId, media, 0)
    } catch {
      return { status: 'idle', reason: 'missing-stream' }
    }
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = null
    }
  }
}

async function defaultResolveStream(media: MediaRow, providerIndex: number): Promise<string | Blob> {
  // This is replaced by the real getStreamUri from StreamUriService
  const stream = media.stream as unknown as Record<string, string> | undefined
  if (!stream) return ''

  const providers = Object.values(stream)
  if (providers.length === 0 || providerIndex >= providers.length) return ''

  return providers[providerIndex]
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LiveStore = Store<any>


/**
 * Create a PlaybackDataPort backed by LiveStore.
 *
 * All `Store<any>` casts are confined to this adapter.
 * Saga callers only see the `PlaybackDataPort` interface.
 */
export function createLiveStorePlaybackDataPort(
  getStore: () => LiveStore | null
): PlaybackDataPort {
  const store = (): LiveStore => {
    const s = getStore()
    if (!s) throw new PlaybackStoreUnavailableError()
    return s
  }

  return {
    async readQueue(): Promise<PlaybackQueue | null> {
      const q = await readQueue(store())
      if (!q) return null
      return {
        trackIds: q.trackIds,
        randomTrackIds: q.randomTrackIds,
        currentPlaying: q.currentPlaying,
        currentTrackId: q.currentTrackId,
        shuffle: q.shuffle,
        repeat: q.repeat,
      }
    },

    async readMedia(songId: string): Promise<MediaRow | null> {
      const q = queryDb(
        tables.media
          .select()
          .where('id', '=', songId)
          .limit(1)
      )
      const result = await store().query(q)
      const row = Array.isArray(result) ? result[0] : null
      return rawToMediaRow(row)
    },

    async replaceQueue(trackIds: readonly string[]): Promise<void> {
      await playAllAction(store(), [...trackIds])
    },

    async addNext(trackIds: readonly string[]): Promise<void> {
      await addNextAction(store(), [...trackIds])
    },

    async select(songId: string): Promise<void> {
      await playMediaAction(store(), songId)
    },

    async next(): Promise<void> {
      await playNextAction(store())
    },

    async previous(): Promise<void> {
      await playPreviousAction(store())
    },
  }
}
