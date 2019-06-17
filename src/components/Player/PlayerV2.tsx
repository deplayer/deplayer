import React from 'react'
import ReactPlayer from 'react-player'
import { Dispatch } from 'redux'

import ProgressBar from './ProgressBar'

type Props = {
  queue: any,
  player: {
    volume: number,
    playing: boolean,
    errorCount: number
  },
  itemCount: number,
  collection: any,
  dispatch: Dispatch,
  match: any
}

class PlayerV2 extends React.Component<Props> {
  player: any

  state = {
    url: null,
    pip: false,
    playing: true,
    controls: false,
    seeking: false,
    light: false,
    volume: 0.8,
    muted: false,
    played: 0,
    loaded: 0,
    duration: 0,
    playbackRate: 1.0,
    loop: false
  }

  ref = player => {
    this.player = player
  }

  load = url => {
    this.setState({
      url,
      played: 0,
      loaded: 0,
      pip: false
    })
  }

  playPause = () => {
    this.setState({ playing: !this.state.playing })
  }

  stop = () => {
    this.setState({ url: null, playing: false })
  }

  toggleControls = () => {
    const url = this.state.url
    this.setState({
      controls: !this.state.controls,
      url: null
    }, () => this.load(url))
  }

  toggleLight = () => {
    this.setState({ light: !this.state.light })
  }
  toggleLoop = () => {
    this.setState({ loop: !this.state.loop })
  }
  setVolume = e => {
    this.setState({ volume: parseFloat(e.target.value) })
  }
  toggleMuted = () => {
    this.setState({ muted: !this.state.muted })
  }
  setPlaybackRate = e => {
    this.setState({ playbackRate: parseFloat(e.target.value) })
  }
  togglePIP = () => {
    this.setState({ pip: !this.state.pip })
  }
  onPlay = () => {
    console.log('onPlay')
    this.setState({ playing: true })
  }
  onEnablePIP = () => {
    console.log('onEnablePIP')
    this.setState({ pip: true })
  }
  onDisablePIP = () => {
    console.log('onDisablePIP')
    this.setState({ pip: false })
  }
  onPause = () => {
    console.log('onPause')
    this.setState({ playing: false })
  }
  onSeekMouseDown = e => {
    this.setState({ seeking: true })
  }
  onSeekChange = e => {
    this.setState({ played: parseFloat(e.target.value) })
  }
  onSeekMouseUp = e => {
    this.setState({ seeking: false })
    this.player.seekTo(parseFloat(e.target.value))
  }
  onProgress = state => {
    console.log('onProgress', state)
    // We only want to update time slider if we are not currently seeking
    if (!this.state.seeking) {
      this.setState(state)
    }
  }

  onEnded = () => {
    console.log('onEnded')
    this.setState({ playing: this.state.loop })
  }

  onDuration = (duration) => {
    console.log('onDuration', duration)
    this.setState({ duration })
  }

  render () {
    const { playing, controls, duration, light, volume, muted, loop, played, playbackRate, pip } = this.state

    const currentPlayingId = this.props.queue.currentPlaying
    const currentPlaying = this.props.collection.rows[currentPlayingId]

    if (!this.props.itemCount || !currentPlaying) {
      return null
    }

    // Getting the first stream URI, in the future will be choosen based on
    // priorities
    const streamUri = currentPlaying
      && currentPlaying.stream
      && currentPlaying.stream.length ?
      currentPlaying.stream[0].uris[0].uri: null

    return (
      <div className='player-container'>
        <ProgressBar
          dispatch={this.props.dispatch}
          total={duration}
          current={played}
          onChange={this.onSeekChange}
        />
        <ReactPlayer
          ref={this.ref}
          className='react-player'
          url={streamUri}
          pip={pip}
          playing={playing}
          controls={controls}
          light={light}
          loop={loop}
          playbackRate={playbackRate}
          volume={volume}
          muted={muted}
          onReady={() => console.log('onReady')}
          onStart={() => console.log('onStart')}
          onPlay={this.onPlay}
          onEnablePIP={this.onEnablePIP}
          onDisablePIP={this.onDisablePIP}
          onPause={this.onPause}
          onBuffer={() => console.log('onBuffer')}
          onSeek={e => console.log('onSeek', e)}
          onEnded={this.onEnded}
          onError={e => console.log('onError', e)}
          onProgress={this.onProgress}
          onDuration={this.onDuration}
        />
      </div>
    )
  }
}

export default PlayerV2
