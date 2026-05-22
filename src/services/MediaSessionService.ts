import type { MediaRow } from '../types/media'
import { Dispatch } from 'redux'
import * as actions from '../constants/ActionTypes'
import logger from '../utils/logger'
import PlayerRefService from './PlayerRefService'

// fix ts navigator typings
// eslint-disable-next-line no-var -- `declare var` is required for ambient global augmentation
declare var navigator: Navigator & { mediaSession?: MediaSession }
// eslint-disable-next-line no-var -- `declare var` is required for ambient global augmentation
declare var window: Window & { MediaMetadata?: new (init: { title: string; artist: string; album: string; artwork: Array<{ src: string; type: string; sizes: string }> }) => MediaMetadata }

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

  registerHandlers(dispatch: Dispatch): void {
    if (this.handlersRegistered) {
      return
    }
    const session = this.getSession()
    if (!session) {
      return
    }

    session.setActionHandler('play', async () => {
      logger.log('MediaSession', 'play action handler called')
      await PlayerRefService.getInstance().play()
      session.playbackState = 'playing'
      dispatch({ type: actions.START_PLAYING })
    })
    session.setActionHandler('pause', () => {
      logger.log('MediaSession', 'pause action handler called')
      PlayerRefService.getInstance().pause()
      session.playbackState = 'paused'
      dispatch({ type: actions.PAUSE_PLAYING })
    })
    session.setActionHandler('previoustrack', () => {
      dispatch({ type: actions.PLAY_PREV })
    })
    session.setActionHandler('nexttrack', () => {
      dispatch({ type: actions.PLAY_NEXT })
    })

    this.handlersRegistered = true
  }

  updateMetadata(media: MediaRow | null): void {
    const session = this.getSession()
    if (!session || !media || !window.MediaMetadata) {
      return
    }

    session.metadata = new window.MediaMetadata({
      title: media.title,
      artist: media.artistName,
      album: media.albumName,
      artwork: [
        { src: this.getThumbnail(media), type: 'image/png', sizes: '96x96' },
        { src: this.getFullCover(media), type: 'image/png', sizes: '512x512' }
      ]
    })

    session.playbackState = 'playing'
  }

  setPlaybackState(state: 'playing' | 'paused' | 'none'): void {
    const session = this.getSession()
    if (session) {
      session.playbackState = state
    }
  }

  private getThumbnail(media: MediaRow): string {
    return media.cover ? media.cover.thumbnailUrl : ''
  }

  private getFullCover(media: MediaRow): string {
    return media.cover ? media.cover.fullUrl : ''
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
