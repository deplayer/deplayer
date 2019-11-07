import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'
import React from 'react'
import ReactPlayer from 'react-player'

import { State as PlayerState } from '../../reducers/player'
import { State as SettingsState } from '../../reducers/settings'
import Controls from './Controls'
import Cover from './Cover'
import ProgressBar from './ProgressBar'
import Spectrum from './../Spectrum'
import * as types from '../../constants/ActionTypes'
import ContextualMenu from './ContextualMenu'

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
    this.setState({ playedSeconds: value })
  }
  onSeekMouseUp = value => {
    this.setState({ seeking: false })
  }
  onProgress = (state: any) => {
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

    return (
      <React.Fragment>
        <ReactPlayer
          className='react-player'
          url={streamUri}
          playing={playing}
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
          onError={(e: Error) => console.log('onError', e)}
          onProgress={this.onProgress}
          onDuration={this.onDuration}
          onSeek={this.onSeekChange}
          progressInterval={1000}
          width={0}
          height={0}
        />
        { this.props.player.showPlayer &&
          <div className='player-container'>
            <ProgressBar
              dispatch={this.props.dispatch}
              total={duration * 1000}
              current={playedSeconds * 1000}
              onChange={this.onSeekMouseUp}
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
