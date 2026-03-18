import Media from '../entities/Media'
import * as actions from '../constants/ActionTypes'
import logger from '../utils/logger'
import PlayerRefService from './PlayerRefService'

// fix ts navigator typings
declare var navigator: any
declare var window: any

export default class MediaSessionService {
  updateMetadata = (media: Media, dispatch: any) => {
    if (this.canSetMediaSession() && media) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: media.title,
        artist: media.artistName,
        album: media.albumName,
        artwork: [
          {
            src: this.getThumbnail(media), type: 'image/png', sizes: '96x96'
          },
          {
            src: this.getFullCover, type: 'image/png', sizes: '512x512'
          }
        ]
      })

      // Set initial playback state to playing (this is called when a track starts)
      navigator.mediaSession.playbackState = 'playing'

      navigator.mediaSession.setActionHandler('play', async () => {
        logger.log('MediaSession', 'play action handler called')
        // Use PlayerRefService for imperative playback control
        await PlayerRefService.getInstance().play()
        navigator.mediaSession.playbackState = 'playing'
        dispatch({type: actions.START_PLAYING})
      })
      navigator.mediaSession.setActionHandler('pause', () => {
        logger.log('MediaSession', 'pause action handler called')
        // Use PlayerRefService for imperative playback control
        PlayerRefService.getInstance().pause()
        navigator.mediaSession.playbackState = 'paused'
        dispatch({type: actions.PAUSE_PLAYING})
      })
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        dispatch({type: actions.PLAY_PREV})
      })
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        dispatch({type: actions.PLAY_NEXT})
      })
    }
  }

  /**
   * Update playback state independently (called from player events)
   */
  setPlaybackState = (state: 'playing' | 'paused' | 'none') => {
    if (this.canSetMediaSession()) {
      navigator.mediaSession.playbackState = state
    }
  }

  getThumbnail(media: Media) {
    return media.cover ? media.cover.thumbnailUrl : ''
  }

  getFullCover(media: Media) {
    return media.cover ? media.cover.fullUrl : ''
  }

  canSetMediaSession () {
    return this.getMediaSession()
  }

  getMediaSession () {
    // Check if browser supports MediaMetadata
    if ('mediaSession' in navigator && window.MediaMetadata) {
      return true
    }

    logger.log('MediaSession', "This browser does not support media session")
    return
  }
}
