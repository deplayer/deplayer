import type { Dispatch } from 'redux'
import type { MediaRow } from '../types/media'
import { queryDb } from '@livestore/livestore'
import type { LiveStore } from '../stores/livestore/accessor'
import { tables } from '../stores/livestore/schema'
import {
  readQueue,
  playAllAction,
  addNextAction,
  playMediaAction,
  playNextAction,
  playPreviousAction,
  toggleShuffleAction,
  resolveCurrentPlayingSongId,
  parseIds,
  type QueueState,
} from '../stores/livestore/queue'
import { rawToMediaRow } from '../stores/livestore/transformMedia'
import type { StreamSource } from './Song/StreamUriService'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlaybackQueue = Omit<QueueState, 'trackIds'> & { trackIds: readonly string[] }


/** Must be called after every await in a queued track-change operation.
 *  Returns `true` while this command is the latest; `false` once superseded. */
export type PlaybackRequestGuard = () => boolean
export type PlaybackResult =
  | { status: 'started'; songId: string; streamUri: string }
  | { status: 'idle'; reason: 'store-unavailable' | 'empty-queue' | 'end-of-queue' | 'missing-media' | 'missing-stream' | 'superseded' }

const SUPERSEDED = 'superseded' as const
export class PlaybackStoreUnavailableError extends Error {
  constructor() {
    super('LiveStore is not available')
  }
}

export interface PlaybackDataPort {
  readQueue(): Promise<PlaybackQueue | null>
  /** O(1) lookup of the current track (head row + at most one point read). */
  readCurrentSongId(): Promise<string | null>
  readMedia(songId: string): Promise<MediaRow | null>
  replaceQueue(trackIds: readonly string[]): Promise<void>
  addNext(trackIds: readonly string[]): Promise<void>
  select(songId: string): Promise<void>
  shuffleQueue(): Promise<void>
  /** Advances the queue; resolves false at the end of the queue (repeat off). */
  next(): Promise<boolean>
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
  private resolveStream: (media: MediaRow, providerIndex: number) => Promise<StreamSource>
  private currentSource: StreamSource | null = null
  private currentSongId: string | null = null
  private playbackRequestGeneration = 0
  private playbackCommandTail: Promise<void> = Promise.resolve()

  constructor(dependencies: {
    data: PlaybackDataPort
    transport: PlaybackTransport
    dispatch: Dispatch
    setBackgroundImage: (url: string) => void
    resolveStream?: (media: MediaRow, providerIndex: number) => Promise<StreamSource>
  }) {
    this.data = dependencies.data
    this.transport = dependencies.transport
    this.dispatch = dependencies.dispatch
    this.setBackgroundImage = dependencies.setBackgroundImage
    this.resolveStream = dependencies.resolveStream ?? defaultResolveStream
  }
  // -----------------------------------------------------------------------
  // Command serialization — track-changing ops queue here so a later
  // request always wins and stale ones return 'superseded'.
  // -----------------------------------------------------------------------

  private async enqueueTrackChange(
    operation: (isCurrent: PlaybackRequestGuard) => Promise<PlaybackResult>
  ): Promise<PlaybackResult> {
    const generation = ++this.playbackRequestGeneration
    const isCurrent: PlaybackRequestGuard = () => generation === this.playbackRequestGeneration

    const result = this.playbackCommandTail
      .catch(() => undefined)
      .then(() => operation(isCurrent))
      .then((outcome) => {
        // Audio was stopped and no track replaced it (end of queue, dead streams).
        // Superseded requests hand off to a newer one; store-unavailable may abort before stopping.
        if (outcome.status === 'idle' && outcome.reason !== SUPERSEDED && outcome.reason !== 'store-unavailable') {
          this.dispatch({ type: 'PLAYBACK_IDLE' })
        }
        return outcome
      })

    this.playbackCommandTail = result.then(() => undefined, () => undefined)

    return result
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  async playList(trackIds: readonly string[], startFromId?: string, options?: { shuffle?: boolean }): Promise<PlaybackResult> {
    if (trackIds.length === 0) {
      return { status: 'idle', reason: 'empty-queue' }
    }

    return this.enqueueTrackChange((isCurrent) =>
      this.wrapStoreUnavailable(async () => {
        // 1. Kill audio before touching the queue
        this.dispatch({ type: 'STOP_PLAYING' })
        this.transport.stop()

        // 2. Replace queue
        await this.data.replaceQueue(trackIds)
        if (!isCurrent()) return { status: 'idle', reason: SUPERSEDED }

        // 3. Resolve target track
        const targetId = startFromId && trackIds.includes(startFromId)
          ? startFromId
          : trackIds[0]

        // If startFromId is not the first track, reposition
        if (startFromId && startFromId !== trackIds[0] && trackIds.includes(startFromId)) {
          await this.data.select(startFromId)
          if (!isCurrent()) return { status: 'idle', reason: SUPERSEDED }
        }

        // 4. Shuffle after replacement (and repositioning) so the current track is preserved
        if (options?.shuffle) {
          await this.data.shuffleQueue()
          if (!isCurrent()) return { status: 'idle', reason: SUPERSEDED }
        }

        return this.startStream(targetId, 0, isCurrent)
      })
    )
  }

  async playSong(songId: string, contextIds?: readonly string[], options?: { providerIndex?: number }): Promise<PlaybackResult> {
    // options.providerIndex: resolve the stream from a specific provider
    // ("Play from {service}"); default 0, the first available provider.
    if (!songId) {
      return { status: 'idle', reason: 'missing-media' }
    }

    return this.enqueueTrackChange((isCurrent) =>
      this.wrapStoreUnavailable(async () => {
        // 1. Kill audio
        this.dispatch({ type: 'STOP_PLAYING' })
        this.transport.stop()

        // 2. Ensure song is in queue
        const enqueued = await this.ensureInQueue(songId, contextIds, isCurrent)
        if (!enqueued) return { status: 'idle', reason: SUPERSEDED }

        // 3. Start stream
        return this.startStream(songId, options?.providerIndex ?? 0, isCurrent)
      })
    )
  }

  async playCurrent(songId: string, options?: { media?: MediaRow; streamUri?: string }): Promise<PlaybackResult> {
    if (options?.streamUri) {
      this.releaseCurrentSource()
      // Explicit URL (peer/demo) — use directly, skip resolver
      this.currentSongId = songId
      this.dispatch({ type: 'PUSH_TO_VIEW', song: songId })
      this.dispatch({ type: 'SET_CURRENT_PLAYING_URL', url: options.streamUri })

      if (options.media) {
        this.dispatch({ type: 'SET_CURRENT_PLAYING_STREAMS', streams: options.media.stream })
        this.dispatch({ type: 'TRACK_STARTED', media: options.media })
      }

      this.dispatch({ type: 'SHOW_PLAYER' })

      await this.transport.play()

      if (options.media?.cover?.fullUrl) {
        this.setBackgroundImage(options.media.cover.fullUrl)
      }

      return { status: 'started', songId, streamUri: options.streamUri }
    }

    // Resolve stream from providers
    return this.startStreamWithMedia(songId, options?.media ?? null, 0, () => true)
  }

  async next(): Promise<PlaybackResult> {
    return this.enqueueTrackChange((isCurrent) =>
      this.wrapStoreUnavailable(async () => {
        this.dispatch({ type: 'STOP_PLAYING' })
        this.transport.stop()

        const advanced = await this.data.next()
        if (!isCurrent()) return { status: 'idle', reason: SUPERSEDED }
        if (!advanced) return { status: 'idle', reason: 'end-of-queue' }

        const songId = await this.data.readCurrentSongId()
        if (!isCurrent()) return { status: 'idle', reason: SUPERSEDED }
        if (!songId) {
          return { status: 'idle', reason: 'end-of-queue' }
        }

        const result = await this.startStream(songId, 0, isCurrent)
        return this.onDeadStream(result, songId, () => this.data.next(), isCurrent)
      })
    )
  }

  async previous(): Promise<PlaybackResult> {
    return this.enqueueTrackChange((isCurrent) =>
      this.wrapStoreUnavailable(async () => {
        this.dispatch({ type: 'STOP_PLAYING' })
        this.transport.stop()

        await this.data.previous()
        if (!isCurrent()) return { status: 'idle', reason: SUPERSEDED }

        const songId = await this.data.readCurrentSongId()
        if (!isCurrent()) return { status: 'idle', reason: SUPERSEDED }
        if (!songId) {
          return { status: 'idle', reason: 'end-of-queue' }
        }

        const result = await this.startStream(songId, 0, isCurrent)
        return this.onDeadStream(result, songId, () => this.data.previous(), isCurrent)
      })
    )
  }

  async retry(providerIndex: number): Promise<PlaybackResult> {
    return this.enqueueTrackChange(async (isCurrent) => {
      const songId = this.currentSongId
      if (!songId) {
        return { status: 'idle', reason: 'missing-media' }
      }

      const result = await this.startStream(songId, providerIndex, isCurrent)
      return this.onDeadStream(result, songId, () => this.data.next(), isCurrent)
    })
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

  private async wrapStoreUnavailable(fn: () => Promise<PlaybackResult>): Promise<PlaybackResult> {
    try {
      return await fn()
    } catch (error) {
      if (error instanceof PlaybackStoreUnavailableError) {
        return { status: 'idle', reason: 'store-unavailable' }
      }
      throw error
    }
  }

  private async ensureInQueue(songId: string, contextIds: readonly string[] | undefined, isCurrent: PlaybackRequestGuard): Promise<boolean> {
    const queue = await this.data.readQueue()
    if (!isCurrent()) return false

    if (!queue || queue.trackIds.length === 0) {
      // No queue — create one
      if (contextIds && contextIds.length > 0) {
        await this.data.replaceQueue(contextIds)
        if (!isCurrent()) return false
        const index = contextIds.indexOf(songId)
        if (index > 0) {
          await this.data.select(songId)
          if (!isCurrent()) return false
        }
      } else {
        await this.data.replaceQueue([songId])
        if (!isCurrent()) return false
      }
    } else {
      const index = queue.trackIds.indexOf(songId)
      if (index !== -1) {
        // Song in queue — reposition
        await this.data.select(songId)
        if (!isCurrent()) return false
      } else {
        // Song not in queue — add next, then play
        await this.data.addNext([songId])
        if (!isCurrent()) return false
        await this.data.select(songId)
        if (!isCurrent()) return false
      }
    }

    return true
  }

  private async startStream(songId: string, providerIndex: number, isCurrent: PlaybackRequestGuard): Promise<PlaybackResult> {
    try {
      const media = await this.data.readMedia(songId)
      if (!isCurrent()) return { status: 'idle', reason: SUPERSEDED }
      return this.startStreamWithMedia(songId, media, providerIndex, isCurrent)
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
    isCurrent: PlaybackRequestGuard,
  ): Promise<PlaybackResult> {
    if (!media) {
      console.warn('[PlaybackController] Media not found:', songId)
      return { status: 'idle', reason: 'missing-media' }
    }

    if (!isCurrent()) return { status: 'idle', reason: SUPERSEDED }

    let source: StreamSource
    try {
      source = await this.resolveStream(media, providerIndex)
    } catch (error) {
      console.error('[PlaybackController] Error resolving stream:', error)
      return { status: 'idle', reason: 'missing-stream' }
    }

    if (!source || !source.url) {
      console.warn('[PlaybackController] No stream URI for:', songId)
      return { status: 'idle', reason: 'missing-stream' }
    }

    if (!isCurrent()) {
      this.releaseSource(source)
      return { status: 'idle', reason: SUPERSEDED }
    }

    this.releaseCurrentSource()
    this.currentSource = source
    const url = source.url

    this.currentSongId = songId

    this.dispatch({ type: 'SET_CURRENT_PLAYING_URL', url })
    this.dispatch({ type: 'PUSH_TO_VIEW', song: songId })
    this.dispatch({ type: 'SET_CURRENT_PLAYING_STREAMS', streams: media.stream })
    this.dispatch({ type: 'SHOW_PLAYER' })
    this.dispatch({ type: 'TRACK_STARTED', media })
    // Imperative play — waits for ReactPlayer to mount the internal element.
    // Redux `playing` state will be set by ReactPlayer's onPlay callback.

    if (!isCurrent()) return { status: 'idle', reason: SUPERSEDED }

    await this.transport.play()

    if (media.cover?.fullUrl) {
      this.setBackgroundImage(media.cover.fullUrl)
    }

    return { status: 'started', songId, streamUri: url }
  }

  /**
   * A dead stream (e.g. a provider URL that 404s or has no decoder) must not
   * halt playback — advance once to the next track, mirroring next()/previous().
   * Only applies to idle results that are not store-unavailable or superseded.
   */
  private async onDeadStream(
    result: PlaybackResult,
    songId: string,
    advance: () => Promise<unknown>,
    isCurrent: PlaybackRequestGuard,
  ): Promise<PlaybackResult> {
    if (result.status === 'idle' && result.reason !== 'store-unavailable' && result.reason !== SUPERSEDED) {
      return this.advanceFallback(songId, advance, isCurrent)
    }
    return result
  }

  /**
   * Advance the queue once more and try to resolve the next track.
   * Used as a fallback when the current track's media/stream is missing.
   * If the next track also fails, returns idle — no recursive retry.
   */
  private async advanceFallback(songId: string, advance: () => Promise<unknown>, isCurrent: PlaybackRequestGuard): Promise<PlaybackResult> {
    try {
      await advance()
      if (!isCurrent()) return { status: 'idle', reason: SUPERSEDED }

      const nextId = await this.data.readCurrentSongId()
      if (!isCurrent()) return { status: 'idle', reason: SUPERSEDED }
      if (!nextId || nextId === songId) {
        return { status: 'idle', reason: 'missing-stream' }
      }

      const media = await this.data.readMedia(nextId)
      if (!isCurrent()) return { status: 'idle', reason: SUPERSEDED }
      if (!media) {
        return { status: 'idle', reason: 'missing-stream' }
      }

      return this.startStreamWithMedia(nextId, media, 0, isCurrent)
    } catch {
      return { status: 'idle', reason: 'missing-stream' }
    }
  }

  /** Blob-kind sources pin a whole file; only those ever need revoking. */
  private releaseSource(source: StreamSource | null): void {
    if (source && source.kind === 'blob') URL.revokeObjectURL(source.url)
  }

  private releaseCurrentSource(): void {
    this.releaseSource(this.currentSource)
    this.currentSource = null
  }
}

async function defaultResolveStream(media: MediaRow, providerIndex: number): Promise<StreamSource> {
  // Fallback resolver: first URI of the requested provider, treated as remote.
  // Production wiring injects StreamUriService.getStreamUri instead.
  const stream = media.stream as unknown as Record<string, { uris?: Array<{ uri?: string }> }> | undefined
  if (!stream) return { url: '', kind: 'remote' }

  const providers = Object.values(stream)
  if (providers.length === 0 || providerIndex >= providers.length) return { url: '', kind: 'remote' }

  return { url: providers[providerIndex]?.uris?.[0]?.uri ?? '', kind: 'remote' }
}
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
        trackIds: parseIds(q.trackIds),
        randomTrackIds: q.randomTrackIds,
        currentPlaying: q.currentPlaying,
        currentTrackId: q.currentTrackId,
        shuffle: q.shuffle,
        repeat: q.repeat,
      }
    },

    async readCurrentSongId(): Promise<string | null> {
      return resolveCurrentPlayingSongId(store)
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

    async shuffleQueue(): Promise<void> {
      // Set (not toggle): the contract is "shuffle is on after this call".
      // replaceQueue always commits shuffle:false, so callers rely on this
      // to enable it; toggling would silently disable an already-shuffled queue.
      await toggleShuffleAction(store(), true)
    },

    async next(): Promise<boolean> {
      return playNextAction(store())
    },

    async previous(): Promise<void> {
      await playPreviousAction(store())
    },
  }
}
