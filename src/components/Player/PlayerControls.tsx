import { Dispatch } from 'redux'
import { Link, Location } from 'react-router-dom'
import React from 'react'
import ReactPlayer from 'react-player'
import classNames from 'classnames'
import { CSSTransition } from 'react-transition-group'
import { InPortal, OutPortal } from 'react-reverse-portal'

import { State as PlayerState } from '../../reducers/player'
import { State as SettingsState } from '../../reducers/settings'
import { State as CollectionState } from '../../reducers/collection'
import { State as QueueState } from '../../reducers/queue'
import { State as AppState } from '../../reducers/app'
import Controls from './Controls'
import Cover from './Cover'
import ProgressBar from './ProgressBar'
import Visualizer from './../Visualizer'
import WebtorrentPlayer from './CustomPlayers/WebtorrentPlayer'
import * as types from '../../constants/ActionTypes'

ReactPlayer.addCustomPlayer((WebtorrentPlayer as any))

type Props = {
  app: AppState,
  queue: QueueState,
  location: Location,
  slim: boolean,
  player: PlayerState,
  settings: SettingsState,
  itemCount: number,
  collection: CollectionState,
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
      this.setState({ timeShown: 0 })
    } else if (this.props.player.fullscreen) {
      this.setState({ timeShown: this.state.timeShown + 1 })
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
    this.props.dispatch({ type: types.SET_PLAYER_DURATION, value: duration })
  }

  // Play prev song of the player list
  playPrev = () => {
    this.props.dispatch({ type: types.PLAY_PREV })
  }

  // Play next song of the player list
  playNext = () => {
    // Force player playing refresh
    this.props.dispatch({ type: types.PLAY_NEXT })
  }

  resetPlayedSeconds = () => {
    this.props.dispatch({ type: types.SET_PLAYER_PLAYED_SECONDS, value: 0 })
  }

  saveTrackPlayed = (songId: string) => {
    this.props.dispatch({ type: types.SONG_PLAYED, songId })
  }

  onError = (e: Error) => {
    console.error(e)
    this.props.dispatch({ type: types.PLAY_ERROR, error: e.message })
  }

  showPlayer = () => {
    if (!this.props.player.showPlayer) {
      this.props.dispatch({ type: types.SHOW_PLAYER })
    }
  }

  render() {
    const {
      playedSeconds,
      playing,
      duration,
      loadedSeconds,
      volume
    } = this.props.player

    const currentPlayingId = this.props.queue.currentPlaying
    if (!currentPlayingId) {
      return null
    }

    const currentPlaying = this.props.collection.rows[currentPlayingId]

    const { streamUri } = this.props.player

    if (!this.props.itemCount || !currentPlaying || !streamUri) {
      return
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

    const config = {
      file: {
        forceAudio: currentPlaying.type === 'audio',
        attributes: {
          className: currentPlaying.type === 'video' ? 'video-element' : 'video-element',
          crossOrigin: 'anonymous'
        }
      }
    }

    const visualizer = this.playerRef.current ? (
      <Visualizer
        playerRef={this.playerRef.current}
        visualizerOnTop={this.props.player.fullscreen}
      />
    ) : null;


    if (currentPlaying.type === 'audio') {
      config.file.attributes['crossOrigin'] = 'anonymous'
    }

    return (
      <React.Fragment>
        <div id="player">
          <InPortal node={this.props.playerPortal}>
            <ReactPlayer
              pip
              fullscreen={this.props.player.fullscreen.toString()}
              className={playerClassnames}
              ref={this.playerRef}
              url={streamUri}
              playing={playing}
              onClick={this.playPause}
              onDoubleClick={() => {
                this.props.dispatch({ type: types.TOGGLE_FULL_SCREEN })
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
              config={config}
              onError={this.onError}
              onProgress={this.onProgress}
              onDuration={this.onDuration}
              progressInterval={1000}
              width={'100%'}
              height={'100%'}
            />
          </InPortal>
        </div>
        {!songFinder && currentPlaying.type === 'video' && (
          <OutPortal
            className={`background-video left-0 right-0 top-0 botton-0 absolute ${currentPlaying.type === 'video' && 'bg-handler'}`}
            node={this.props.playerPortal}
          />
        )}
        {showControls &&
          <div className={'player-container'} style={{ zIndex: 102 }}>
            <CSSTransition
              classNames="player"
              appear={true}
              timeout={{ enter: 500, exit: 500, appear: 500 }}
              enter={true}
              exit={true}
            >
              <div key='player-controls' className='flex justify-between items-center flex-col  bg-gray-100/70 dark:bg-black/80'>
                <div className='absolute w-full md:top-0'>
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
                      <Link to={`/song/${currentPlaying.id}`} className='text-lg md:text-xl text-sky-900 dark:text-sky-200 block'>
                        <h5 className='truncate'>
                          {currentPlaying.title}
                        </h5>
                      </Link>
                      {currentPlaying.artist &&
                        <Link to={`/artist/${currentPlaying.artist.id}`} className='block'>
                          <h6 className='truncate text-blue-400'>
                            {currentPlaying.artist.name}
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
                      />
                      <div className='w-16'>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CSSTransition>
          </div>
        }
        {visualizer}
      </React.Fragment>
    )
  }
}

export default PlayerControls
