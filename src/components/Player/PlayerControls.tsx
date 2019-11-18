import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'
import React from 'react'
import ReactPlayer from 'react-player'
import classNames from 'classnames'
import KeyHandler, {KEYPRESS} from 'react-key-handler'

import { State as PlayerState } from '../../reducers/player'
import { State as SettingsState } from '../../reducers/settings'
import Button from '../common/Button'
import ContextualMenu from './ContextualMenu'
import Controls from './Controls'
import Cover from './Cover'
import Icon from '../common/Icon'
import ProgressBar from './ProgressBar'
import Spectrum from './../Spectrum'
import * as types from '../../constants/ActionTypes'

type Props = {
  queue: any,
  slim: boolean,
  player: PlayerState,
  settings: SettingsState,
  itemCount: number,
  collection: any,
  dispatch: Dispatch,
  match: any
}

class PlayerControls extends React.Component<Props> {
  player: any

  state = {
    playing: true,
    seeking: false,
    volume: 0.8,
    muted: false,
    playedSeconds: 0,
    loaded: 0,
    duration: 0,
    timeShown: 0,
    playbackRate: 1.0,
    loop: false
  }

  componentWillMount() {
    if (this.props.player.playing && !this.state.playing) {
      this.playPause()
    }
  }

  playPause = () => {
    this.setState({ playing: !this.state.playing })
  }

  toggleLoop = () => {
    this.setState({ loop: !this.state.loop })
  }
  setVolume = (value: number) => {
    this.setState({ volume: value / 100 })
  }
  toggleMuted = () => {
    this.setState({ muted: !this.state.muted })
  }
  setPlaybackRate = e => {
    this.setState({ playbackRate: parseFloat(e.target.value) })
  }
  onPlay = () => {
    this.setState({ playing: true })
  }
  onPause = () => {
    this.setState({ playing: false })
  }
  onSeekMouseDown = e => {
    this.setState({ seeking: true })
  }
  onSeekChange = value => {
    this.setState({ playedSeconds: value / 1000 })
  }
  onSeekMouseUp = value => {
    this.setState({ seeking: false })
  }
  onProgress = (state: any) => {
    if (this.props.player.fullscreen && this.state.timeShown > 2) {
      this.props.dispatch({ type: types.HIDE_PLAYER })
      this.setState({ timeShown: 0})
    } else {
      this.setState({ timeShown: this.state.timeShown + 1})
    }

    if (this.props.player.errorCount) {
      this.props.dispatch({ type: types.CLEAR_PLAYER_ERRORS })
    }
    // We only want to update time slider if we are not currently seeking
    if (!this.state.seeking) {
      this.setState(state)
    }
  }
  onDuration = (duration: number) => {
    this.setState({ duration })
  }

  // Play prev song of the player list
  playPrev = () => {
    if (this.props.queue.prevSongId) {
      this.props.dispatch({type: types.PLAY_PREV})
    }
  }

  // Play next song of the player list
  playNext = () => {
    if (this.props.queue.nextSongId) {
      // Force player playing refresh
      this.props.dispatch({type: types.PLAY_NEXT})
      this.setState({ playing: true })
    }
  }

  saveTrackPlayed = (songId: string) => {
    this.props.dispatch({type: types.SONG_PLAYED, songId})
  }

  onError = (e: Error) => {
    this.props.dispatch({type: types.PLAY_ERROR, error: e})
  }

  showPlayer = () => {
    if (!this.props.player.showPlayer) {
      this.props.dispatch({ type: types.SHOW_PLAYER })
    }
  }

  render () {
    const {
      playing,
      duration,
      volume,
      playedSeconds
    } = this.state

    const currentPlayingId = this.props.queue.currentPlaying
    const currentPlaying = this.props.collection.rows[currentPlayingId]
    const { streamUri } = this.props.player

    if (!this.props.itemCount || !currentPlaying || !streamUri) {
      return null
    }

    const playerClassnames = classNames({
      'react-player': true,
      'fullscreen': this.props.player.fullscreen
    })

    const showControls = this.props.player.showPlayer

    return (
      <React.Fragment>
        <KeyHandler
          keyEventName={KEYPRESS}
          keyValue="f"
          onKeyHandle={() => this.props.dispatch({ type: types.TOGGLE_FULL_SCREEN })}
        />
        <ReactPlayer
          className={playerClassnames}
          url={streamUri}
          playing={playing}
          onClick={this.playPause}
          onMouseMove={this.showPlayer}
          controls={false}
          loop={false}
          playbackRate={1}
          volume={volume}
          muted={false}
          onPlay={this.onPlay}
          onPause={this.onPause}
          onEnded={() => {
            this.saveTrackPlayed(currentPlayingId)
            this.playNext()
          }}
          config={{ }}
          onError={this.onError}
          onProgress={this.onProgress}
          onDuration={this.onDuration}
          onSeek={this.onSeekChange}
          progressInterval={1000}
          width={'100%'}
          height={'100%'}
        />
        { showControls &&
          <div className='player-container'>
            <ProgressBar
              dispatch={this.props.dispatch}
              total={duration * 1000}
              current={playedSeconds * 1000}
              onChange={this.onSeekChange}
            />

            <div className='flex justify-between items-center'>
              <Cover slim={this.props.slim} song={currentPlaying} />
              <div className='player'>
                <div className='player-tools'>
                  <Link to={`/song/${currentPlaying.id}`}>
                    <h5 className='song-title'>
                      { currentPlaying.title } - { currentPlaying.artist ? currentPlaying.artist.name : '' }
                    </h5>
                  </Link>
                  <Controls
                    playPrev={this.playPrev}
                    isPlaying={this.state.playing}
                    playPause={this.playPause}
                    playNext={this.playNext}
                    dispatch={this.props.dispatch}
                  />
                </div>
              </div>
              <Button
                transparent
                onClick={() => this.props.dispatch({ type: types.TOGGLE_FULL_SCREEN })}
              >
                <Icon
                  icon='faExpand'
                  className='mr-1 w-8'
                />
              </Button>
              <ContextualMenu
                volume={volume * 100}
                dispatch={this.props.dispatch}
                setVolume={this.setVolume}
              />
            </div>
            <Spectrum audioSelector={'#player-audio audio'} />
          </div>
        }
      </React.Fragment>
    )
  }
}

export default PlayerControls
