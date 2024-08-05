import React from 'react'
import { ReactPlayerProps } from 'react-player'
import Webtorrent from 'webtorrent'

const announceList = [
  ['wss://tracker.btorrent.xyz'],
  ['udp://tracker.openbittorrent.com:80'],
  ['udp://tracker.internetwarriors.net:1337'],
  ['udp://tracker.leechers-paradise.org:6969'],
  ['udp://tracker.coppersurfer.tk:6969'],
  ['udp://exodus.desync.com:6969'],
  ['wss://tracker.openwebtorrent.com'],
]

function canPlay(url: string) {
  return typeof url === 'string' && url.startsWith('magnet:')
}

function canEnablePIP() {
  return false
}

export class TorrentPlayer extends React.Component<ReactPlayerProps> {
  static displayName = 'TorrentPlayer'
  static canPlay = canPlay
  static canEnablePIP = canEnablePIP
  player: any
  prevPlayer: any
  client: any

  constructor(props: any) {
    super(props)
    this.client = new Webtorrent()
  }

  ref = (player: any) => {
    if (this.player) {
      // Store previous player to be used by removeListeners()
      this.prevPlayer = this.player
    }
    this.player = player
  }

  componentDidMount() {
    this.addListeners()
  }

  componentDidUpdate() {
    this.getSource(this.props.url)
  }

  componentWillUnmount() {
    this.removeListeners()
  }

  addListeners() {
    const { onReady, onPlay, onBuffer, onBufferEnd, onPause, onEnded, onError } = this.props
    this.player.addEventListener('canplay', onReady)
    this.player.addEventListener('play', onPlay)
    this.player.addEventListener('waiting', onBuffer)
    this.player.addEventListener('playing', onBufferEnd)
    this.player.addEventListener('pause', onPause)
    this.player.addEventListener('seeked', this.onSeek)
    this.player.addEventListener('ended', onEnded)
    this.player.addEventListener('error', onError)
  }

  removeListeners() {
    const { onReady, onPlay, onBuffer, onBufferEnd, onPause, onEnded, onError } = this.props
    this.player.removeEventListener('canplay', onReady)
    this.player.removeEventListener('play', onPlay)
    this.player.removeEventListener('waiting', onBuffer)
    this.player.removeEventListener('playing', onBufferEnd)
    this.player.removeEventListener('pause', onPause)
    this.player.removeEventListener('seeked', this.onSeek)
    this.player.removeEventListener('ended', onEnded)
    this.player.removeEventListener('error', onError)
  }

  onSeek = (e: any) => {
    if (this.props.onSeek === undefined) return;
    this.props.onSeek(e.target.currentTime)
  }

  play() {
    const promise = this.player.play()
    if (promise) {
      promise.catch(this.props.onError)
    }
  }

  pause() {
    this.player.pause()
  }

  stop() {
    this.player.removeAttribute('src')
  }

  seekTo(seconds: any) {
    this.player.currentTime = seconds
  }

  setVolume(fraction: any) {
    this.player.volume = fraction
  }

  mute = () => {
    this.player.muted = true
  }

  unmute = () => {
    this.player.muted = false
  }

  setPlaybackRate(rate: any) {
    this.player.playbackRate = rate
  }

  load(url: any) {
    this.getSource(url)
  }

  getDuration() {
    if (!this.player) return null
    const { duration, seekable } = this.player
    // on iOS, live streams return Infinity for the duration
    // so instead we use the end of the seekable timerange
    if (duration === Infinity && seekable.length > 0) {
      return seekable.end(seekable.length - 1)
    }
    return duration
  }

  getCurrentTime() {
    if (!this.player) return null
    return this.player.currentTime
  }

  getSecondsLoaded() {
    if (!this.player) return null
    const { buffered } = this.player
    if (buffered.length === 0) {
      return 0
    }
    const end = buffered.end(buffered.length - 1)
    const duration = this.getDuration() || 0
    if (end > duration) {
      return duration
    }
    return end
  }

  async getSource(url: any) {
    console.log('loading webtorrent url: ', url)

    if (typeof url !== 'string' && url.length < 10) return

    try {
      this.client.add(url, {
        announce: announceList
      })
    } catch (error) {
      console.log('error: ', error)
    }

    this.client.on('torrent', (torrent: any) => {
      const file = torrent.files.find((file: any) => {
        return file.type.startsWith('video/')
      })

      if (file === undefined) return

      console.log('file: ', file)

      file.streamTo('#torrent-video-player', {
        autoplay: this.props.playing,
        muted: this.props.muted,
        controls: this.props.controls
      })
    })
  }


  render() {
    const { playing, loop, muted, width, height } = this.props
    const style = {
      width: width === 'auto' ? width : '100%',
      height: height === 'auto' ? height : '100%'
    };

    return (
      <video
        ref={this.ref}
        style={style}
        autoPlay={playing}
        controls={false}
        loop={loop}
        muted={muted}
        id='torrent-video-player'
      />
    )
  }
}

export default TorrentPlayer
