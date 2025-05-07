import { Dispatch } from 'redux'
import { Location } from 'react-router-dom'
import React from 'react'
import ReactPlayer from 'react-player'
import classNames from 'classnames'
import { CSSTransition } from 'react-transition-group'
import { InPortal, OutPortal, createHtmlPortalNode } from 'react-reverse-portal'
import SpectrumVisualizer from '../SpectrumVisualizer'
import { State as PlayerState } from '../../reducers/player'
import { State as SettingsState } from '../../reducers/settings'
import { State as CollectionState } from '../../reducers/collection'
import { State as QueueState } from '../../reducers/queue'
import { State as AppState } from '../../reducers/app'
import Controls from './Controls'
import Cover from './Cover'
import ProgressBar from './ProgressBar'
import WebtorrentPlayer from './CustomPlayers/WebtorrentPlayer'
import PeerStreamPlayer from './CustomPlayers/PeerStreamPlayer'
import DigitalScreen from './DigitalScreen'
import * as types from '../../constants/ActionTypes'
import PlayerRefService from '../../services/PlayerRefService'
import type Media from '../../entities/Media'

// Add custom players to ReactPlayer with proper type casting
ReactPlayer.addCustomPlayer(WebtorrentPlayer as unknown as ReactPlayer)
ReactPlayer.addCustomPlayer(PeerStreamPlayer as unknown as ReactPlayer)

interface Props {
  app: AppState
  queue: QueueState
  location: Location
  slim: boolean
  player: PlayerState
  settings: SettingsState
  itemCount: number
  collection: CollectionState
  dispatch: Dispatch
  playerPortal: ReturnType<typeof createHtmlPortalNode>
  match: {
    params: {
      [key: string]: string
    }
  }
}

interface State {
  timeShown: number;
  played: number;
  loaded: number;
  playedSeconds: number;
  loadedSeconds: number;
}

/**
 * PlayerControls is a comprehensive media player interface component that manages audio/video playback
 * and provides user controls. It combines several key features:
 * 
 * Core Features:
 * - Media playback using ReactPlayer with support for both audio and video
 * - Transport controls (play/pause, previous, next)
 * - Progress bar showing playback position and buffering status
 * - Dynamic display of current track information (title, artist)
 * - Volume control
 * 
 * Advanced Features:
 * - Portal-based rendering for flexible positioning of video content
 * - Fullscreen mode with auto-hiding controls
 * - Audio visualization support
 * - Custom player support for WebTorrent and PeerStream playback
 * - Automatic track progression
 * 
 * Layout:
 * - Main player container with progress bar at the top
 * - Cover art display
 * - Track information (title + artist) with links to detailed views
 * - Control buttons (prev, play/pause, next)
 * - Optional video display area when playing video content
 * 
 * The component uses portals to manage video content positioning, allowing the video
 * to be rendered in a different part of the DOM while maintaining playback control.
 * This is particularly useful for fullscreen and picture-in-picture modes.
 */

class PlayerControls extends React.Component<Props, State> {
  private playerRef: React.RefObject<ReactPlayer>;
  public state: State = {
    timeShown: 0,
    played: 0,
    loaded: 0,
    playedSeconds: 0,
    loadedSeconds: 0
  };

  constructor(props: Props) {
    super(props);
    this.playerRef = React.createRef();
  }

  componentDidMount(): void {
    PlayerRefService.getInstance().setPlayerRef(this.playerRef)
  }

  componentDidUpdate(prevProps: Props): void {
    const { queue, collection, settings } = this.props
    const { currentPlaying } = queue

    // Show notification for track changes if enabled
    if (prevProps.queue.currentPlaying !== currentPlaying && currentPlaying) {
      const currentTrack = collection.rows[currentPlaying]
      if (currentTrack && settings.settings.app.notifications?.enabled && 
          settings.settings.app.notifications?.showTrackChanges) {
        this.showTrackNotification(currentTrack)
      }
    }
  }

  componentWillUnmount(): void {
    PlayerRefService.getInstance().setPlayerRef(null)
  }

  showTrackNotification = (track: Media): void => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    const options: NotificationOptions = {
      body: `${track.artistName || 'Unknown Artist'} - ${track.albumName || 'Unknown Album'}`,
      icon: track.cover?.thumbnailUrl || track.cover?.fullUrl,
      silent: true,
      tag: 'now-playing',
      requireInteraction: false
    }

    new Notification(track.title || 'Unknown Title', options)
  }

  showErrorNotification = (error: string): void => {
    const { settings } = this.props
    if (!('Notification' in window) || Notification.permission !== 'granted' || 
        !settings.settings.app.notifications?.enabled || 
        !settings.settings.app.notifications?.showErrors) {
      return
    }

    const options: NotificationOptions = {
      body: error,
      icon: '/icons/error.png',
      tag: 'player-error',
      requireInteraction: true
    }

    new Notification('Playback Error', options)
  }

  handleError = (error: Error): void => {
    const { dispatch } = this.props
    const errorMessage = error.message || 'An error occurred during playback'
    
    this.showErrorNotification(errorMessage)
    
    dispatch({
      type: types.SEND_NOTIFICATION,
      notification: 'notifications.player.error',
      error: errorMessage
    })
  }

  toggleFullscreen = (): void => {
    const videoElement = this.playerRef.current?.getInternalPlayer()
    if (videoElement && videoElement instanceof HTMLVideoElement) {
      if (!document.fullscreenElement) {
        videoElement.requestFullscreen().catch(err => {
          console.error('Error attempting to enable fullscreen:', err)
        })
        this.props.dispatch({ type: types.TOGGLE_FULL_SCREEN, value: true })
      } else {
        document.exitFullscreen()
        this.props.dispatch({ type: types.TOGGLE_FULL_SCREEN, value: false })
      }
    }
  }

  playPause = (): void => {
    this.props.dispatch({ type: types.TOGGLE_PLAYING })
  }

  onPlay = (): void => {
    this.props.dispatch({ type: types.START_PLAYING })
  }

  onSeekChange = (value: number | number[]): void => {
    const seekValue = Array.isArray(value) ? value[0] : value;
    // seekValue is in milliseconds, convert to seconds for the player
    const seekSeconds = seekValue / 1000;
    
    this.setState({ 
      playedSeconds: seekSeconds,
      played: seekSeconds / this.props.player.duration
    }, () => {
      console.log('Seek state updated:', {
        seekValueMs: seekValue,
        seekSeconds,
        playedSeconds: this.state.playedSeconds,
        played: this.state.played,
        duration: this.props.player.duration
      });
      
      if (this.playerRef.current) {
        this.playerRef.current.seekTo(seekSeconds);
      }
    });
  }

  onProgress = (state: { played: number; loaded: number; playedSeconds: number; loadedSeconds: number }): void => {
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

    // Update local state with progress information
    this.setState({
      played: state.played,
      loaded: state.loaded,
      playedSeconds: state.playedSeconds,
      loadedSeconds: state.loadedSeconds
    }, () => {
      console.log('Progress state updated:', {
        played: this.state.played,
        loaded: this.state.loaded,
        playedSeconds: this.state.playedSeconds,
        loadedSeconds: this.state.loadedSeconds
      });
    });
  }

  onDuration = (duration: number): void => {
    this.props.dispatch({ type: types.SET_PLAYER_DURATION, value: duration })
  }

  // Play prev song of the player list
  playPrev = (): void => {
    this.props.dispatch({ type: types.PLAY_PREV })
  }

  // Play next song of the player list
  playNext = (): void => {
    // Force player playing refresh
    this.props.dispatch({ type: types.PLAY_NEXT })
  }

  resetPlayedSeconds = (): void => {
    this.props.dispatch({ type: types.SET_PLAYER_PLAYED_SECONDS, value: 0 })
  }

  saveTrackPlayed = (songId: string): void => {
    this.props.dispatch({ type: types.SONG_PLAYED, songId })
  }

  onError = (e: Error): void => {
    console.error(e)
    this.props.dispatch({ type: types.PLAY_ERROR, error: e.message })
  }

  showPlayer = (): void => {
    if (!this.props.player.showPlayer) {
      this.props.dispatch({ type: types.SHOW_PLAYER })
    }
  }

  getInternalPlayer = (): HTMLAudioElement | null => {
    if (!this.playerRef.current) return null
    const internalPlayer = this.playerRef.current.getInternalPlayer()
    if (internalPlayer instanceof HTMLAudioElement) {
      return internalPlayer
    }
    return null
  }

  onSeekMouseUp = (value: number | number[]): void => {
    if (typeof value === 'number') {
      this.playerRef.current?.seekTo(value / 1000);
    }
  }

  render(): React.ReactNode {
    const {
      playing,
      duration,
      volume
    } = this.props.player

    const {
      playedSeconds,
      loadedSeconds
    } = this.state

    const currentPlayingId = this.props.queue.currentPlaying
    if (!currentPlayingId) {
      console.log("No current playing id")
      return null
    }

    const currentPlaying = this.props.collection.rows[currentPlayingId]

    const { streamUri } = this.props.player

    if (!this.props.itemCount || !streamUri || !currentPlaying) {
      return null
    }

    const playerClassnames = classNames({
      'react-player': true,
      'fullscreen': this.props.player.fullscreen
    })

    // Show controls only if player is shown
    const showControls = this.props.player.showPlayer

    const songFinder = this.props
      .location
      .pathname
      .match(new RegExp(`/song/${currentPlayingId}`))

    const config = {
      file: {
        forceAudio: currentPlaying.type === 'audio',
        attributes: {
          id: 'react-player-internal',
          className: currentPlaying.type === 'video' ? 'video-element' : 'audio-element',
          crossOrigin: 'anonymous'
        }
      }
    }

    if (currentPlaying.type === 'audio') {
      config.file.attributes['crossOrigin'] = 'anonymous'
    }

    const showFullscreen = this.props.app.showVisuals || currentPlaying.type === 'video'
    const playerControlsClassnames = classNames({
      'flex': true,
      'justify-between': true,
      'items-center': true,
      'flex-col': true,
      'bg-base-200': true,
      'backdrop-blur': this.props.player.fullscreen
    })

    const internalPlayer = this.getInternalPlayer()

    return (
      <React.Fragment>
        <div id="player" style={{ gridArea: 'player' }} className='before:content-[""] before:absolute before:inset-0 before:blur-sm before:bg-base-200/70'>
          <InPortal node={this.props.playerPortal}>
            <ReactPlayer
              id="react-player"
              pip
              fullscreen={this.props.player.fullscreen ? "true" : "false"}
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
                this.playNext()
                this.saveTrackPlayed(currentPlayingId)
              }}
              config={config}
              onError={this.handleError}
              onProgress={this.onProgress}
              onDuration={this.onDuration}
              progressInterval={1000}
              width={'100%'}
              height={'100%'}
              controls={currentPlaying.type === 'video'}
            />
          </InPortal>
          {!songFinder && currentPlaying.type === 'video' && (
            <div id='player-portal' className="background-video left-0 right-0 top-0 botton-0 absolute bg-handler">
              <OutPortal
                className={`player-portal background-video left-0 right-0 top-0 botton-0 absolute ${currentPlaying.type === 'video' && 'bg-handler'}`}
                node={this.props.playerPortal}
              />
            </div>
          )}
          {showControls &&
            <div className='player-container' style={{ gridArea: 'player', zIndex: 101 }}>
              <CSSTransition
                classNames="player"
                style={{ zIndex: 102 }}
                appear={true}
                timeout={{ enter: 500, exit: 500, appear: 500 }}
                enter={true}
                exit={true}
              >
                <div key='player-controls' className={playerControlsClassnames} style={{ zIndex: 103 }}>
                  <div className='absolute w-full md:top-0 pointer-events-none' style={{ zIndex: 151 }}>
                    <ProgressBar
                      total={duration * 1000}
                      current={playedSeconds * 1000}
                      buffered={loadedSeconds * 1000}
                      dispatch={this.props.dispatch}
                      onChange={this.onSeekChange}
                      onAfterChange={this.onSeekMouseUp}
                    />
                  </div>
                  <div className='flex flex-initial items-center justify-between min-w-0 max-w-full w-full' style={{ zIndex: 150 }}>
                    <Cover song={currentPlaying} />
                    <div className='flex justify-between items-center w-full'>
                      <div className='flex w-full'>
                        <DigitalScreen
                          playedSeconds={playedSeconds}
                          duration={duration}
                          currentPlaying={currentPlaying}
                          repeat={this.props.queue.repeat}
                          shuffle={this.props.queue.shuffle}
                        />
                        {(internalPlayer && this.props.app.showSpectrum) && (
                          <div className='mr-4 hidden md:block'>
                            <SpectrumVisualizer
                              width={100}
                              height={40}
                              capColor={'red'}
                              capHeight={2}
                              meterWidth={2}
                              meterCount={40}
                              playerRef={internalPlayer}
                              meterColor={[
                                { stop: 0, color: '#f00' },
                                { stop: 0.5, color: '#0CD7FD' },
                                { stop: 1, color: '#ecc94b' }
                              ]}
                              gap={1}
                            />
                          </div>
                        )}
                      </div>
                      <div className='player-tools flex justify-center items-center'>
                        <Controls
                          mqlMatch={this.props.app.mqlMatch}
                          playPrev={this.playPrev}
                          isPlaying={this.props.player.playing}
                          playPause={this.playPause}
                          playNext={this.playNext}
                          showFullscreen={showFullscreen}
                          toggleFullscreen={this.toggleFullscreen}
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
        </div>
      </React.Fragment>
    )
  }
}

export default PlayerControls
