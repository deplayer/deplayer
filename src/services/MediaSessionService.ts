import type { MediaRow } from '../types/media'
import { Dispatch } from 'redux'
import * as actions from '../constants/ActionTypes'
import logger from '../utils/logger'


// fix ts navigator typings
// eslint-disable-next-line no-var -- `declare var` is required for ambient global augmentation
declare var navigator: Navigator & { mediaSession?: MediaSession }
// eslint-disable-next-line no-var -- `declare var` is required for ambient global augmentation
declare var window: Window & { MediaMetadata?: new (init: MediaMetadataInit) => MediaMetadata }

const DEFAULT_SEEK_OFFSET_SECONDS = 10

interface SessionTransport {
  seekTo(seconds: number): void
  getCurrentTime(): number
  stop(): void
}

export default class MediaSessionService {
  private static instance: MediaSessionService | null = null
  private static loggedUnsupported = false
  private handlersRegistered = false

  private constructor() {}

  static getInstance(): MediaSessionService {
    if (!MediaSessionService.instance) {
      MediaSessionService.instance = new MediaSessionService()
    }
    return MediaSessionService.instance
  }

  registerHandlers(dispatch: Dispatch, transport: SessionTransport): void {
    if (this.handlersRegistered) {
      return
    }
    const session = this.getSession()
    if (!session) {
      return
    }

    session.setActionHandler('play', () => {
      logger.log('MediaSession', 'play action handler called')
      dispatch({ type: actions.PLAYBACK_PLAY_REQUESTED })
    })
    session.setActionHandler('pause', () => {
      logger.log('MediaSession', 'pause action handler called')
      dispatch({ type: actions.PLAYBACK_PAUSE_REQUESTED })
    })
    session.setActionHandler('previoustrack', () => {
      dispatch({ type: actions.PLAY_PREV })
    })
    session.setActionHandler('nexttrack', () => {
      dispatch({ type: actions.PLAY_NEXT })
    })
    session.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        transport.seekTo(details.seekTime)
      }
    })
    session.setActionHandler('seekbackward', (details) => {
      const offset = details.seekOffset ?? DEFAULT_SEEK_OFFSET_SECONDS
      transport.seekTo(Math.max(0, transport.getCurrentTime() - offset))
    })
    session.setActionHandler('seekforward', (details) => {
      const offset = details.seekOffset ?? DEFAULT_SEEK_OFFSET_SECONDS
      transport.seekTo(transport.getCurrentTime() + offset)
    })
    session.setActionHandler('stop', () => {
      transport.stop()
      dispatch({ type: actions.STOP_PLAYING })
      dispatch({ type: actions.PLAYBACK_IDLE })
    })

    this.handlersRegistered = true
  }

  updateMetadata(media: MediaRow): void {
    const session = this.getSession()
    if (!session || !window.MediaMetadata) {
      return
    }

    const artwork: MediaImage[] = []
    if (media.cover?.thumbnailUrl) {
      artwork.push({ src: media.cover.thumbnailUrl, sizes: '96x96' })
    }
    if (media.cover?.fullUrl) {
      artwork.push({ src: media.cover.fullUrl, sizes: '512x512' })
    }

    session.metadata = new window.MediaMetadata({
      title: media.title,
      artist: media.artistName,
      album: media.albumName,
      artwork,
    })
  }

  setPlaybackState(state: MediaSessionPlaybackState): void {
    const session = this.getSession()
    if (session) {
      session.playbackState = state
    }
  }

  /** Nothing is playing anymore: drop the OS card instead of leaving a dead one. */
  clear(): void {
    const session = this.getSession()
    if (session) {
      session.metadata = null
      session.playbackState = 'none'
    }
  }

  /** Feeds the OS scrubber; ignores unknown/invalid durations (streams, not-yet-loaded media). */
  setPositionState(duration: number, position: number, playbackRate: number): void {
    const session = this.getSession()
    if (!session?.setPositionState || !Number.isFinite(duration) || duration <= 0 || playbackRate === 0) {
      return
    }
    try {
      session.setPositionState({
        duration,
        position: Math.min(Math.max(0, position), duration),
        playbackRate,
      })
    } catch (e) {
      logger.log('MediaSession', 'setPositionState failed', e)
    }
  }

  private getSession(): MediaSession | null {
    if ('mediaSession' in navigator && window.MediaMetadata && navigator.mediaSession) {
      return navigator.mediaSession
    }
    if (!MediaSessionService.loggedUnsupported) {
      logger.log('MediaSession', 'This browser does not support media session')
      MediaSessionService.loggedUnsupported = true
    }
    return null
  }
}
