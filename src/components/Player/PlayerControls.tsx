import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'
import KeyHandler, {KEYPRESS} from 'react-key-handler'
import React from 'react'
import * as ReactDOM from 'react-dom'
import ReactPlayer from 'react-player'
import classNames from 'classnames'
import { CSSTransitionGroup } from 'react-transition-group'
import { InPortal, OutPortal } from 'react-reverse-portal'

import { State as PlayerState } from '../../reducers/player'
import { State as SettingsState } from '../../reducers/settings'
import Controls from './Controls'
import Cover from './Cover'
import KeyHandlers from './KeyHandlers'
import ProgressBar from './ProgressBar'
import Spectrum from './../Spectrum'
import WebtorrentPlayer from './CustomPlayers/WebtorrentPlayer'
import * as types from '../../constants/ActionTypes'

ReactPlayer.addCustomPlayer((WebtorrentPlayer as any))

type Props = {
  app: any,
  queue: any,
  location: any,
  slim: boolean,
  player: PlayerState,
  settings: SettingsState,
  itemCount: number,
  collection: any,
  dispatch: Dispatch,
  playerPortal: any,
  match: any
}

class PlayerControls extends React.Component<Props> {
  playerRef: any = React.createRef()

  state = {
    timeShown: 0,
  }

  playPause = () => {
    this.props.dispatch({ type: types.TOGGLE_PLAYING })
  }

  onPlay = () => {
    this.props.dispatch({ type: types.START_PLAYING })
  }

  onSeekChange = (value: any) => {
    this.props.dispatch({ type: types.SET_PLAYER_PLAYED_SECONDS, value: value / 1000 })
    this.playerRef.current.seekTo(
      value / 1000
    )
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
    // We only want to update time slider if we are not currently
    this.props.dispatch({ type: types.SET_PLAYER_PROGRESS, value: state })
  }

  onDuration = (duration: number) => {
    this.props.dispatch({ type: types.SET_PLAYER_DURATION, value: duration})
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
    }
  }

  resetPlayedSeconds = () => {
    this.props.dispatch({ type: types.SET_PLAYER_PLAYED_SECONDS, value: 0 })
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
      playedSeconds,
      playing,
      duration,
      loadedSeconds,
      volume
    } = this.props.player

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

    const songFinder = this.props
      .location
      .pathname
      .match(new RegExp(`/song/${currentPlayingId}`))

    return (
      <React.Fragment>
        { handlers }
        <div id="player">
          <InPortal node={this.props.playerPortal}>
            <ReactPlayer
              pip
              fullscreen={this.props.player.fullscreen}
              controls={songFinder && currentPlaying.media_type === 'video'}
              className={playerClassnames}
              ref={this.playerRef}
              url={streamUri}
              playing={playing}
              onClick={this.playPause}
              onDoubleClick={() => {
                this.props.dispatch({type: types.TOGGLE_FULL_SCREEN})
              }}
              onMouseMove={this.showPlayer}
              volume={volume / 100}
              muted={false}
              onPlay={this.onPlay}
              onEnded={() => {
                this.resetPlayedSeconds()
                this.saveTrackPlayed(currentPlayingId)
                this.playNext()
              }}
              config={{
                file: {
                  forceAudio: currentPlaying.media_type === 'audio',
                  attributes: {
                    className: currentPlaying.media_type === 'video' ? 'video-element': 'video-element'
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
          </InPortal>
        </div>
        { !songFinder && currentPlaying.media_type === 'video' && (
          <OutPortal
            className={`left-0 right-0 top-0 botton-0 absolute ${currentPlaying.media_type === 'video' && 'bg-handler'}`}
            node={this.props.playerPortal}
          />
        )}
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
              <div key='player-controls' className='flex justify-between items-center flex-col'>
                <div className='absolute top-0 w-full'>
                  <ProgressBar
                    dispatch={this.props.dispatch}
                    total={duration * 1000}
                    buffered={loadedSeconds * 1000}
                    current={playedSeconds * 1000}
                    onChange={this.onSeekChange}
                  />
                </div>

                <div className='flex flex-initial items-center justify-between min-w-0 max-w-full w-full'>
                  <Cover song={currentPlaying} />
                  <div className='flex justify-between items-center w-full'>
                    <div className='mx-2 pr-2 md:text-center w-full truncate overflow-hidden'>
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
                    <div className='player-tools flex fustify-center items-center'>
                      <Controls
                        mqlMatch={this.props.app.mqlMatch}
                        playPrev={this.playPrev}
                        isPlaying={this.props.player.playing}
                        playPause={this.playPause}
                        playNext={this.playNext}
                        dispatch={this.props.dispatch}
                      />
                      <div className='w-16'>
                      </div>
                    </div>
                  </div>
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
