import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'
import React from 'react'
import ReactPlayer from 'react-player'

import { State as PlayerState } from '../../reducers/player'
import { State as SettingsState } from '../../reducers/settings'
import { getStreamUri } from '../../services/Song/StreamUriService'
import Controls from './Controls'
import Cover from './Cover'
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

  ref = React.createRef()

  componentWillMount() {
    if (this.props.player.playing && !this.state.playing) {
      this.playPause()
    }
  }

  load = (url: string) => {
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

  toggleLight = () => {
    this.setState({ light: !this.state.light })
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
  togglePIP = () => {
    this.setState({ pip: !this.state.pip })
  }
  onPlay = () => {
    this.setState({ playing: true })
  }
  onEnablePIP = () => {
    this.setState({ pip: true })
  }
  onDisablePIP = () => {
    this.setState({ pip: false })
  }
  onPause = () => {
    this.setState({ playing: false })
  }
  onSeekMouseDown = e => {
    this.setState({ seeking: true })
  }
  onSeekChange = value => {
    this.setState({ played: value })
  }
  onSeekMouseUp = value => {
    this.setState({ seeking: false })
  }
  onProgress = (state: any) => {
    console.log('onProgress')
    // We only want to update time slider if we are not currently seeking
    if (!this.state.seeking) {
      console.log('onProgress: ', state)
      this.setState(state)
    }
  }
  onProgressEvent = (event: any) => {
    console.log(event.currentTime)
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
      played,
    } = this.state

    const currentPlayingId = this.props.queue.currentPlaying
    const currentPlaying = this.props.collection.rows[currentPlayingId]

    if (!this.props.itemCount || !currentPlaying) {
      return null
    }

    // Getting the first stream URI, in the future will be choosen based on
    // priorities
    const streamUri = getStreamUri(currentPlaying, this.props.settings)

    return (
      <React.Fragment>
        <ReactPlayer
          ref={this.ref}
          className='react-player'
          url={streamUri}
          playing={playing}
          controls={false}
          light={false}
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
          width={0}
          height={0}
        />
        { this.props.player.showPlayer &&
          <div className='player-container'>
            <ProgressBar
              dispatch={this.props.dispatch}
              total={duration}
              current={played * 100}
              onChange={this.onSeekMouseUp}
            />

            <div className='player-contents'>
              <Cover slim={this.props.slim} song={currentPlaying} />
              <div className='player'>
                <div className='player-tools'>
                  <div>
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
                      volume={volume * 100}
                      setVolume={this.setVolume}
                      dispatch={this.props.dispatch}
                    />
                  </div>
                </div>
              </div>
            </div>
            <Spectrum audioSelector={'#player-audio audio'} />
          </div>
        }
      </React.Fragment>
    )
  }
}

export default PlayerControls
