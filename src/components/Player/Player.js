// @flow

import React, { Component } from 'react'
import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'

import ProgressBar from './ProgressBar'
import PlayPauseButton from './PlayPauseButton'
import ShuffleButton from './ShuffleButton'
import CoverImage from '../MusicTable/CoverImage'
import SkipButton from './SkipButton'
import VolumeControl from './VolumeControl'
import Spectrum from './../Spectrum'
import { PLAY_NEXT, PLAY_PREV } from '../../constants/ActionTypes'

type Props = {
  queue: any,
  player: {
    volume: number,
    playing: boolean
  },
  itemCount: number,
  collection: any,
  dispatch: Dispatch,
  match: any
}

type State = {
  error: string,
  currentTime: number,
  volume?: number
}

// TODO: Fill all events https://www.w3schools.com/tags/ref_av_dom.asp
class Player extends Component<Props, State> {
  state = {
    error: '',
    currentTime: 0,
    volume: undefined,
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
    if (this.props.queue.nextSongId) {
      this.props.dispatch({type: PLAY_NEXT})
    }
  }

  // Play prev song of the player list
  playPrev = () => {
    if (this.props.queue.prevSongId) {
      this.props.dispatch({type: PLAY_PREV})
    }
  }

  // Set player volume
  setVolume = (value: any) => {
    const volume = value.currentTarget.value
    this.setState({volume})
    this.playerRef.current.volume = (volume / 100)
  }

  // Set player currentTime
  setCurrentTime = (value: any) => {
    const currentTime = value
    this.setState({currentTime})
    this.playerRef.current.currentTime = currentTime
  }

  render() {
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

    // Getting desired volume
    const volume = this.state.volume ? this.state.volume : this.props.player.volume

    return (
      <div className='player-container'>
        <ProgressBar
          dispatch={this.props.dispatch}
          total={this.playerRef.current ? this.playerRef.current.duration : 0}
          current={this.state.currentTime}
          onChange={this.setCurrentTime}
        />
        <div className='player-contents'>
          <div className='media-thumb'>
            <CoverImage
              cover={currentPlaying.cover}
              size='thumbnail'
              albumName={currentPlaying.album ? currentPlaying.album.name : 'N/A'}
            />
          </div>
          <div className='player'>
            <div className='player-tools'>
              <div>
                <Link to={`/song/${currentPlaying.id}`}>
                  <h5 className='song-title'>
                    { currentPlaying.title } - { currentPlaying.artist ? currentPlaying.artist.name : '' }
                  </h5>
                </Link>
                <audio
                  id='player-audio'
                  ref={this.playerRef}
                  src={streamUri}
                  volume={ volume }
                  crossorigin="anonymous"
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
                    volume={ volume }
                    onChange={this.setVolume}
                  />
                  <ShuffleButton
                    dispatch={this.props.dispatch}
                  />
                </div>
                {this.state.error}
              </div>
            </div>
          </div>
        </div>
        <Spectrum />
      </div>
    )
  }
}

export default Player
