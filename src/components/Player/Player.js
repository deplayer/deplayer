// @flow

import React, { Component } from 'react'
import { Dispatch } from 'redux'

import ProgressBar from './ProgressBar'
import PlayPauseButton from './PlayPauseButton'
import SkipButton from './SkipButton'
import { setCurrentPlaying } from '../../actions/playlist'

type Props = {
  playlist: any,
  dispatch: Dispatch
}

type State = {
  error: string,
  currentTime: number
}

// TODO: Fill all events https://www.w3schools.com/tags/ref_av_dom.asp
class Player extends Component<Props, State> {
  state = {
    error: '',
    currentTime: 0
  }
  playerRef: { current: null | HTMLMediaElement }

  constructor(props: Props) {
    super(props)
    this.playerRef = React.createRef()
  }

  logError(ev) {
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

  playNext = () => {
    const nextSong = this.props.playlist.tracks[this.props.playlist.nextSongId]
    if (nextSong) {
      this.props.dispatch(setCurrentPlaying(nextSong))
    }
  }

  playPrev = () => {
    const prevSong = this.props.playlist.tracks[this.props.playlist.prevSongId]
    if (prevSong) {
      this.props.dispatch(setCurrentPlaying(prevSong))
    }
  }

  render() {
    const currentPlaying = this.props.playlist.currentPlaying || {}
    // Getting the first stream URI
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
          onError={this.logError.bind(this)}
          autoPlay={ this.props.playlist.playing }
          onTimeUpdate={ this.onTimeUpdate }
        />
        <div className='ui icon buttons player-controls'>
          <SkipButton
            onClick={this.playPrev}
            type="prev"
          />
          <PlayPauseButton
            playing={this.isPlaying()}
            onClick={this.playPause}
          />
          <SkipButton
            onClick={this.playNext}
            type="next"
          />
        </div>
        {this.state.error}
      </div>
    )
  }
}

export default Player
