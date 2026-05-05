import React from 'react'
import { ReactPlayerProps } from 'react-player'
import WebtorrentServer from '../../WebtorrentServer'

function canPlay(url: string) {
  return typeof url === 'string' && url.startsWith('magnet:')
}

function canEnablePIP() {
  return false
}

class TorrentPlayer extends React.Component<ReactPlayerProps> {
  static displayName = 'TorrentPlayer'
  static canPlay = canPlay
  static canEnablePIP = canEnablePIP
  player: HTMLVideoElement | null = null
  prevPlayer: HTMLVideoElement | null = null
  client: unknown = null

  constructor(props: ReactPlayerProps) {
    console.log('starting torrent player')

    super(props)
  }

  ref = (player: HTMLVideoElement | null) => {
    if (this.player) {
      // Store previous player to be used by removeListeners()
      this.prevPlayer = this.player
    }
    this.player = player
  }

  componentDidMount() {
    this.addListeners()
  }

  componentWillUnmount() {
    this.removeListeners()
  }

  addListeners() {
    if (!this.player) return
    const { onReady, onPlay, onBuffer, onBufferEnd, onPause, onEnded, onError } = this.props
    this.player.addEventListener('canplay', onReady as unknown as EventListener)
    this.player.addEventListener('play', onPlay as unknown as EventListener)
    this.player.addEventListener('waiting', onBuffer as unknown as EventListener)
    this.player.addEventListener('playing', onBufferEnd as unknown as EventListener)
    this.player.addEventListener('pause', onPause as unknown as EventListener)
    this.player.addEventListener('seeked', this.onSeek)
    this.player.addEventListener('ended', onEnded as unknown as EventListener)
    this.player.addEventListener('error', onError as unknown as EventListener)
  }

  removeListeners() {
    if (!this.player) return
    const { onReady, onPlay, onBuffer, onBufferEnd, onPause, onEnded, onError } = this.props
    this.player.removeEventListener('canplay', onReady as unknown as EventListener)
    this.player.removeEventListener('play', onPlay as unknown as EventListener)
    this.player.removeEventListener('waiting', onBuffer as unknown as EventListener)
    this.player.removeEventListener('playing', onBufferEnd as unknown as EventListener)
    this.player.removeEventListener('pause', onPause as unknown as EventListener)
    this.player.removeEventListener('seeked', this.onSeek)
    this.player.removeEventListener('ended', onEnded as unknown as EventListener)
    this.player.removeEventListener('error', onError as unknown as EventListener)
  }

  onSeek = (e: Event) => {
    if (this.props.onSeek === undefined) return;
    this.props.onSeek((e.target as HTMLMediaElement).currentTime)
  }

  play() {
    if (!this.player) return
    const promise = this.player.play()
    if (promise) {
      promise.catch(this.props.onError)
    }
  }

  pause() {
    if (!this.player) return
    this.player.pause()
  }

  stop() {
    if (!this.player) return
    this.player.removeAttribute('src')
  }

  seekTo(seconds: number) {
    if (!this.player) return
    this.player.currentTime = seconds

    if (this.props.onSeek) {
      this.props.onSeek(seconds)
    }
  }

  setVolume(fraction: number) {
    if (!this.player) return
    this.player.volume = fraction
  }

  mute = () => {
    if (!this.player) return
    this.player.muted = true
  }

  unmute = () => {
    if (!this.player) return
    this.player.muted = false
  }

  setPlaybackRate(rate: number) {
    if (!this.player) return
    this.player.playbackRate = rate
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

  render() {
    const { playing, loop, muted, width, height, url } = this.props
    const style = {
      width: width === 'auto' ? width : '100%',
      height: height === 'auto' ? height : '100%'
    };

    if (!url) {
      return null
    }

    return (
      <WebtorrentServer
        player={this.ref}
        loop={!!loop}
        muted={!!muted}
        style={style}
        playing={!!playing}
        onPlay={this.props.onPlay}
        onPause={this.props.onPause}
        onBuffer={this.props.onBuffer}
        onBufferEnd={this.props.onBufferEnd}
        onError={this.props.onError}
        onEnded={this.props.onEnded}
        onProgress={this.props.onProgress}
        onDuration={this.props.onDuration}
        onSeek={this.props.onSeek}
        controls={true}
        url={url?.toString()}
      />
    )
  }
}

export default TorrentPlayer
