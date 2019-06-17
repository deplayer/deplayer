import * as React from 'react'
import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'

import ProgressBar from './ProgressBar'
import CoverImage from '../MusicTable/CoverImage'
import Spectrum from './../Spectrum'
import Controls from './Controls'
import * as types from '../../constants/ActionTypes'

const PLAYER_RETRIES = 5

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

type State = {
  currentTime: number,
  volume?: number
}

// TODO: Fill all events https://www.w3schools.com/tags/ref_av_dom.asp
class Player extends React.Component<Props, State> {
  state = {
    currentTime: 0,
    volume: 100,
  }
  playerRef: { current: any }

  constructor(props: Props) {
    super(props)
    this.playerRef = React.createRef()
  }

  onError(ev: any) {
    this.props.dispatch({
      type: types.REGISTER_PLAYER_ERROR
    })

    this.props.dispatch({
      type: types.SEND_NOTIFICATION,
      notification: 'notifications.player.play_failed',
      level: 'warning'
    })

    if (this.props.player.errorCount <= PLAYER_RETRIES) {
      this.props.dispatch({
        type: types.PLAY_NEXT
      })
    }
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
      this.props.dispatch({type: types.PLAY_NEXT})
    }
  }

  // Play prev song of the player list
  playPrev = () => {
    if (this.props.queue.prevSongId) {
      this.props.dispatch({type: types.PLAY_PREV})
    }
  }

  // Set player volume
  setVolume = (volume: number) => {
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
    const duration = this.playerRef.current ? this.playerRef.current.duration : 0

    return (
      <div className='player-container'>
        <ProgressBar
          dispatch={this.props.dispatch}
          total={duration}
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
                  crossOrigin="anonymous"
                  onError={this.onError.bind(this)}
                  autoPlay={ this.props.player.playing }
                  onTimeUpdate={ this.onTimeUpdate }
                  onEnded={this.playNext}
                />
                <Controls
                  playPrev={this.playPrev}
                  isPlaying={this.isPlaying()}
                  playPause={this.playPause}
                  playNext={this.playNext}
                  volume={volume}
                  setVolume={this.setVolume}
                  dispatch={this.props.dispatch}
                />
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
