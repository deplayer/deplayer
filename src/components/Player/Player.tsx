import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'
import * as React from 'react'

import { State as PlayerState } from '../../reducers/player'
import { getStreamUri } from '../../services/Song/StreamUriService'
import Controls from './Controls'
import CoverImage from '../MusicTable/CoverImage'
import ProgressBar from './ProgressBar'
import Spectrum from './../Spectrum'
import * as types from '../../constants/ActionTypes'

const PLAYER_RETRIES = 5

type Props = {
  queue: any,
  slim: boolean,
  player: PlayerState,
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

  onError() {
    this.props.dispatch({
      type: types.REGISTER_PLAYER_ERROR,
      error: this.playerRef.current.error
    })

    this.props.dispatch({
      type: types.SEND_NOTIFICATION,
      notification: 'notifications.player.play_failed',
      level: 'warning'
    })

    // Stop playing when too many errors
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
    if (this.isPlaying()) {
      this.playerRef.current.pause()
    } else {
      this.playerRef.current.play()
    }
  }

  isPlaying = () => {
    if (this.playerRef.current) {
      return !this.playerRef.current.paused
    }

    return false
  }

  // Play next song of the player list
  playNext = () => {
    this.props.dispatch({type: types.PLAY_NEXT})
  }

  saveTrackPlayed = (songId: string) => {
    this.props.dispatch({type: types.SONG_PLAYED, songId})
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
    const { slim } = this.props
    const currentPlayingId = this.props.queue.currentPlaying
    const currentPlaying = this.props.collection.rows[currentPlayingId]

    if (!this.props.itemCount || !currentPlaying) {
      return null
    }

    if (!this.props.player.showPlayer) {
      return null
    }

    // Getting the first stream URI, in the future will be choosen based on
    // priorities
    const streamUri = getStreamUri(currentPlaying)

    // Getting desired volume
    const volume = this.state.volume ? this.state.volume : this.props.player.volume
    const duration = this.playerRef.current ? this.playerRef.current.duration : 0

    const cover = !slim &&  (
      <div className='media-thumb'>
        <CoverImage
          cover={currentPlaying.cover}
          size='thumbnail'
          albumName={currentPlaying.album ? currentPlaying.album.name : 'N/A'}
          />
        </div>
    )

    return (
      <div className={`player-container ${slim ? 'slim': ''}`}>
        <ProgressBar
          dispatch={this.props.dispatch}
          total={duration}
          current={this.state.currentTime}
          onChange={this.setCurrentTime}
        />
        <div className='player-contents'>
         { cover }
          <div className='player'>
            <div className={`player-tools ${slim ? 'slim': ''}`}>
              <div>
                <h5 className='song-title'>
                  <Link to={`/song/${currentPlaying.id}`}>
                    { currentPlaying.title } - { currentPlaying.artist ? currentPlaying.artist.name : '' }
                  </Link>
                  <Link className='song-count' to={'/queue'}>
                    { this.props.queue.trackIds.indexOf(currentPlaying.id) + 1 } / { this.props.queue.trackIds.length }
                  </Link>
                </h5>
                <audio
                  id='player-audio'
                  ref={this.playerRef}
                  src={streamUri}
                  crossOrigin="anonymous"
                  onError={() => this.onError()}
                  autoPlay={ this.props.player.playing }
                  onTimeUpdate={ this.onTimeUpdate }
                  onEnded={() => {
                    this.saveTrackPlayed(currentPlayingId)
                    this.playNext()
                  }}
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
        <Spectrum audioSelector={'#player-audio'} />
      </div>
    )
  }
}

export default Player
