import React from 'react'
import ReactPlayer from 'react-player'
import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'

import Controls from './Controls'
import Spectrum from './../Spectrum'
import CoverImage from '../MusicTable/CoverImage'
import ProgressBar from './ProgressBar'

import * as types from '../../constants/ActionTypes'

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

  toggleLight = () => {
    this.setState({ light: !this.state.light })
  }
  toggleLoop = () => {
    this.setState({ loop: !this.state.loop })
  }
  setVolume = value => {
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
    this.player.seekTo(parseFloat(value))
  }
  onProgress = state => {
    // We only want to update time slider if we are not currently seeking
    if (!this.state.seeking) {
      this.setState(state)
    }
  }

  onEnded = () => {
    this.setState({ playing: this.state.loop })
  }

  onDuration = (duration) => {
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
      this.props.dispatch({type: types.PLAY_NEXT})
    }
  }

  render () {
    const {
      playing,
      controls,
      duration,
      light,
      volume,
      muted,
      loop,
      played,
      playbackRate,
      pip
    } = this.state

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
          current={played * 100}
          onChange={this.onSeekMouseUp}
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
                <ReactPlayer
                  id='player-audio'
                  config={{
                  }}
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
                  onPlay={this.onPlay}
                  onEnablePIP={this.onEnablePIP}
                  onDisablePIP={this.onDisablePIP}
                  onPause={this.onPause}
                  onEnded={this.onEnded}
                  onError={e => console.log('onError', e)}
                  onProgress={this.onProgress}
                  onDuration={this.onDuration}
                  width={0}
                  height={0}
                />
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
    )
  }
}

export default PlayerV2
