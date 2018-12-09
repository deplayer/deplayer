import * as actions from '../constants/ActionTypes'

export default class MediaSessionService {
  updateMetadata = (media, dispatch) => {
    if (this.getMediaSession()) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: media.title,
        artist: media.artist.name,
        album: media.album.name,
        artwork: [
          {
            src: media.cover.thumbnailUrl, type: 'image/png', sizes: '96x96'
          },
          {
            src: media.cover.fullUrl, type: 'image/png', sizes: '512x512'
          }
        ]
      })
      navigator.mediaSession.setActionHandler('play', () => {
        dispatch(actions.START_PLAYING)
      })
      navigator.mediaSession.setActionHandler('pause', () => {
        dispatch(actions.PAUSE_PLAYING)
      })
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        dispatch(actions.PLAY_PREV)
      })
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        dispatch(actions.PLAY_NEXT)
      })

      navigator.mediaSession.setActionHandler('seekbackward', () => { })
      navigator.mediaSession.setActionHandler('seekforward', () => {})
    }
  }

  getMediaSession () {
    // Check if browser supports MediaMetadata
    if ('mediaSession' in navigator && window.MediaMetadata) {
      return true
    }

    console.log("This browser does not support media session")
    return
  }
}
