import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'
import KeyHandler, {KEYPRESS} from 'react-key-handler'
import React from 'react'
import ReactPlayer from 'react-player'
import classNames from 'classnames'
import { CSSTransitionGroup } from 'react-transition-group'

import { State as PlayerState } from '../../reducers/player'
import { State as SettingsState } from '../../reducers/settings'
import ContextualMenu from './ContextualMenu'
import Controls from './Controls'
import Cover from './Cover'
import KeyHandlers from './KeyHandlers'
import ProgressBar from './ProgressBar'
import Spectrum from './../Spectrum'
import WebtorrentPlayer from './CustomPlayers/WebtorrentPlayer'
import * as types from '../../constants/ActionTypes'

ReactPlayer.addCustomPlayer(WebtorrentPlayer)

type Props = {
  app: any,
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
  playerRef: any

  state = {
    playing: true,
    seeking: false,
    volume: 0.8,
    muted: false,
    buffered: 0,
    playedSeconds: 0,
    loadedSeconds: 0,
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

    this.playerRef = React.createRef()
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
    this.playerRef.current.seekTo(
      value / 1000
    )
  }

  onSeekMouseUp = value => {
    this.setState({ seeking: false })
  }

  onProgress = (state: any) => {
    if (this.props.player.fullscreen && this.state.timeShown > 2) {
      this.props.player.showPlayer && this.props.dispatch({ type: types.HIDE_PLAYER })
      this.setState({ timeShown: 0})
    } else if (this.props.player.fullscreen) {
      this.setState({ timeShown: this.state.timeShown + 1})
    } else {
      !this.props.player.showPlayer && this.props.dispatch({ type: types.SHOW_PLAYER })
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
      loadedSeconds,
      playedSeconds
    } = this.state

    const currentPlayingId = this.props.queue.currentPlaying
    const currentPlaying = this.props.collection.rows[currentPlayingId]
    const { streamUri } = this.props.player

    const handlers = (
      <>
        <KeyHandler
          keyEventName={KEYPRESS}
          keyValue="f"
          onKeyHandle={() => this.props.dispatch({ type: types.TOGGLE_FULL_SCREEN })}
        />
        <KeyHandlers
          playPrev={this.playPrev}
          playPause={this.playPause}
          playNext={this.playNext}
        />
      </>
    )

    if (!this.props.itemCount || !currentPlaying || !streamUri) {
      return handlers
    }

    const playerClassnames = classNames({
      'react-player': true,
      'fullscreen': this.props.player.fullscreen
    })

    const showControls = this.props.player.showPlayer

    return (
      <React.Fragment>
        { handlers }
        <ReactPlayer
          className={playerClassnames}
          ref={this.playerRef}
          url={streamUri}
          playing={playing}
          onClick={this.playPause}
          onDoubleClick={() => {
            this.props.dispatch({type: types.TOGGLE_FULL_SCREEN})
          }}
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
          config={{
            file: {
              forceAudio: currentPlaying.type === 'audio',
              attributes: {
                className: currentPlaying.type === 'video' ? 'video-element': 'video-element'
              }
            }
          }}
          onError={this.onError}
          onProgress={this.onProgress}
          onDuration={this.onDuration}
          progressInterval={1000}
          width={'100%'}
          height={'100%'}
        />
        { showControls &&
          <div className={ classNames({'player-container': true }) } style={{ zIndex: 102 }}>
            <CSSTransitionGroup
              transitionName="player"
              transitionAppear={true}
              transitionAppearTimeout={500}
              transitionEnterTimeout={500}
              transitionLeaveTimeout={500}
              transitionEnter={true}
              transitionLeave={true}
            >
              <div key='player-controls' className='flex justify-between items-center'>
                <div className='absolute top-0 w-full'>
                  <ProgressBar
                    dispatch={this.props.dispatch}
                    total={duration * 1000}
                    buffered={loadedSeconds * 1000}
                    current={playedSeconds * 1000}
                    onChange={this.onSeekChange}
                  />
                </div>

                <div className='flex flex-initial items-center flex-grow min-w-0'>
                  <Cover song={currentPlaying} />
                  <div className='mx-2 pr-2 md:text-center w-full'>
                    <Link to={`/song/${currentPlaying.id}`} className='text-lg md:text-xl text-blue-200 block'>
                      <h5 className='truncate'>
                        { currentPlaying.title }
                      </h5>
                    </Link>
                    { currentPlaying.artist &&
                      <Link to={`/artist/${currentPlaying.artist.id}`} className='block'>
                        <h6 className='truncate text-blue-600'>
                          {  currentPlaying.artist.name }
                        </h6>
                      </Link>
                    }
                  </div>
                </div>
                <div className='player-tools flex fustify-center items-center'>
                  <Controls
                    mqlMatch={this.props.app.mqlMatch}
                    playPrev={this.playPrev}
                    isPlaying={this.state.playing}
                    playPause={this.playPause}
                    playNext={this.playNext}
                    dispatch={this.props.dispatch}
                  />
                </div>
                <div className='flex flex-grow-0'>
                  <ContextualMenu
                    volume={volume * 100}
                    dispatch={this.props.dispatch}
                    setVolume={this.setVolume}
                  />
                </div>
              </div>
              {
                this.playerRef.current &&
                  <Spectrum audioSelector='video, audio' />
              }
            </CSSTransitionGroup>
          </div>
        }
      </React.Fragment>
    )
  }
}

export default PlayerControls
