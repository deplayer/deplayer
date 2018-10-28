// @flow

import React, { Component } from 'react'
import { Dispatch } from 'redux'

import ProgressBar from './ProgressBar'
import PlayPauseButton from './PlayPauseButton'
import SkipButton from './SkipButton'
import VolumeControl from './VolumeControl'
import { setCurrentPlaying } from '../../actions/playlist'

type Props = {
  playlist: any,
  player: any,
  collection: any,
  dispatch: Dispatch,
  match: any
}

type State = {
  error: string,
  currentTime: number,
  volume: number
}

// TODO: Fill all events https://www.w3schools.com/tags/ref_av_dom.asp
class Player extends Component<Props, State> {
  state = {
    error: '',
    currentTime: 0,
    volume: 0,
  }
  playerRef: { current: any }

  constructor(props: Props) {
    super(props)
    this.playerRef = React.createRef()
  }

  logError(ev: any) {
    this.setState({
      error: this.playerRef.current.error.message
    })
  }

  // Update current time state
  onTimeUpdate = () => {
    this.setState({
      currentTime: this.playerRef && this.playerRef.current ? this.playerRef.current.currentTime: 0
    })
  }

  playPause = () => {
    this.isPlaying() ?
      this.playerRef.current.pause():
      this.playerRef.current.play()
  }

  isPlaying = () => {
    if (this.playerRef.current) {
      return !this.playerRef.current.paused
    }

    return false
  }

  // Play next song of the player list
  playNext = () => {
    const nextSong = this.props.collection.rows[this.props.playlist.nextSongId]
    if (nextSong) {
      this.props.dispatch(setCurrentPlaying(nextSong))
    }
  }

  // Play prev song of the player list
  playPrev = () => {
    const prevSong = this.props.collection.rows[this.props.playlist.prevSongId]
    if (prevSong) {
      this.props.dispatch(setCurrentPlaying(prevSong))
    }
  }

  // Set player volume
  setVolume = (value: any) => {
    const volume = value.currentTarget.value
    this.setState({volume})
    this.playerRef.current.volume = (volume / 100)
  }

  render() {
    const currentPlaying = this.props.playlist.currentPlaying || {}
    // Getting the first stream URI, in the future will be choosen based on
    // priorities
    const streamUri = currentPlaying
      && currentPlaying.stream
      && currentPlaying.stream.length ?
      currentPlaying.stream[0].uris[0].uri: null

    return (
      <div className='player'>
        <ProgressBar
          total={this.playerRef.current ? this.playerRef.current.duration : 0}
          current={this.state.currentTime}
        />
        <audio
          ref={this.playerRef}
          src={streamUri}
          volume={this.state.volume}
          onError={this.logError.bind(this)}
          autoPlay={ this.props.player.playing }
          onTimeUpdate={ this.onTimeUpdate }
          onEnded={this.playNext}
        />
        <div className='ui icon buttons player-controls'>
          <SkipButton
            onClick={this.playPrev}
            keyValues={['ArrowLeft', 'k']}
            type="prev"
          />
          <PlayPauseButton
            playing={this.isPlaying()}
            onClick={this.playPause}
          />
          <SkipButton
            onClick={this.playNext}
            keyValues={['ArrowRight', 'j']}
            type="next"
          />
          <VolumeControl
            volume={this.state.volume}
            onChange={this.setVolume}
          />
        </div>
        {this.state.error}
      </div>
    )
  }
}

export default Player
