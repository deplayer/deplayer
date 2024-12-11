import React from 'react'
import { ReactPlayerProps } from 'react-player'

function canPlay(url: string) {
  return typeof url === 'string' && url.startsWith('peer://')
}

function canEnablePIP() {
  return false
}

export default class PeerStreamPlayer extends React.Component<ReactPlayerProps> {
  static displayName = 'PeerStreamPlayer'
  static canPlay = canPlay
  static canEnablePIP = canEnablePIP
  player: HTMLVideoElement | null = null
  prevPlayer: HTMLVideoElement | null = null

  ref = (player: HTMLVideoElement) => {
    if (this.player) {
      this.prevPlayer = this.player
    }
    this.player = player
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

  getDuration() {
    if (!this.player) return null
    return this.player.duration
  }

  getCurrentTime() {
    if (!this.player) return null
    return this.player.currentTime
  }

  getSecondsLoaded() {
    if (!this.player) return null
    const { buffered } = this.player
    if (buffered.length === 0) return 0
    const end = buffered.end(buffered.length - 1)
    const duration = this.getDuration() || 0
    return end > duration ? duration : end
  }

  render() {
    const { playing, loop, muted, width, height } = this.props
    const style = {
      width: width === 'auto' ? width : '100%',
      height: height === 'auto' ? height : '100%'
    }

    return (
      <video
        ref={this.ref}
        style={style}
        autoPlay={playing}
        controls={false}
        loop={loop}
        muted={muted}
        id='peer-stream-player'
      />
    )
  }
} 