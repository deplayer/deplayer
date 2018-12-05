export default class MediaSessionService {
  updateMetadata = (media) => {
    if (this.getMediaSession()) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: media.title,
        artist: media.artist.name,
        album: media.album.name,
        artwork: [
          {
            src: media.cover.thumbnailUrl, type: 'image/jpg', sizes: '96x96'
          },
          {
            src: media.cover.fullUrl, type: 'image/jpg', sizes: '512x512'
          }
        ]
      })
    }
  }

  getMediaSession () {
    if ('mediaSession' in navigator && window.MediaMetadata) {
      return true
    }

    console.log("This browser does not support media session")
    return
  }
}
