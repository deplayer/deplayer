import React from 'react'
import { ReactPlayerProps } from 'react-player'
import PlayerRefService from '../../../services/PlayerRefService'

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
  currentStream: MediaStream | null = null

  ref = (player: HTMLVideoElement) => {
    if (this.player) {
      // Clean up old player
      if (this.player.srcObject instanceof MediaStream) {
        this.player.srcObject = null;
      }
      this.prevPlayer = this.player
    }
    this.player = player
  }

  play() {
    console.log("Attempting to play stream");

    if (!this.player) return
    console.log("Player exists");
    const promise = this.player.play()
    if (promise) {
      promise.catch((error) => {
        console.error("Error playing stream:", error);
        this.props.onError && this.props.onError(error);
      })
    }
  }

  pause() {
    if (!this.player) return
    this.player.pause()
  }

  stop() {
    if (!this.player) return
    if (this.player.srcObject instanceof MediaStream) {
      this.player.srcObject = null;
    }
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

  setStream(stream: MediaStream | null) {
    console.log("setStream called with stream:", stream);
    if (!this.player || !stream) return;

    try {
      // Clean up old stream if exists
      if (this.player.srcObject instanceof MediaStream) {
        this.player.srcObject = null;
      }

      // Set new stream
      this.player.srcObject = stream;
      this.currentStream = stream;
      
      // Add error handler
      this.player.onerror = (e) => {
        console.error("Video element error:", e);
        this.props.onError && this.props.onError(e);
      };

      console.log("About to call play() in setStream");
      // Wait for loadedmetadata event before playing
      this.player.onloadedmetadata = () => {
        console.log("Stream metadata loaded, attempting to play");
        this.play();
      };
    } catch (error) {
      console.error("Error setting stream:", error);
      this.props.onError && this.props.onError(error);
    }
  }

  componentDidMount() {
    console.log("PeerStreamPlayer mounted");
    const stream = PlayerRefService.getInstance().getPeerStream();
    console.log("Initial stream:", stream);
    this.setStream(stream);
  }

  componentDidUpdate(prevProps: ReactPlayerProps) {
    if (this.props.url !== prevProps.url) {
      console.log("URL changed, updating stream");
      const stream = PlayerRefService.getInstance().getPeerStream();
      console.log("Updated stream:", stream);
      this.setStream(stream);
    }
  }

  componentWillUnmount() {
    this.stop();
  }

  render() {
    const { loop, muted, width, height } = this.props
    const style = {
      width: width === 'auto' ? width : '100%',
      height: height === 'auto' ? height : '100%'
    }

    return (
      <video
        ref={this.ref}
        style={style}
        autoPlay={true}
        controls={false}
        loop={loop}
        muted={muted}
        playsInline
        id='peer-stream-player'
      />
    )
  }
} 