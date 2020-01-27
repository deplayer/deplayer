import Media from '../entities/Media'
import * as actions from '../constants/ActionTypes'
import logger from '../utils/logger'

// fix ts navigator typings
declare var navigator: any
declare var window: any

export default class MediaSessionService {
  updateMetadata = (media: Media, dispatch: any) => {
    if (this.canSetMediaSession()) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: media.title,
        artist: media.artist.name,
        album: media.album.name,
        artwork: [
          {
            src: this.getThumbnail(media), type: 'image/png', sizes: '96x96'
          },
          {
            src: this.getFullCover, type: 'image/png', sizes: '512x512'
          }
        ]
      })
      navigator.mediaSession.setActionHandler('play', () => {
        dispatch({type: actions.START_PLAYING})
      })
      navigator.mediaSession.setActionHandler('pause', () => {
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
