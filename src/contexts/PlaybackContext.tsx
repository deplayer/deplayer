import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

/**
 * PlaybackContext - Ephemeral playback state
 * 
 * This context manages transient playback state that doesn't need to persist:
 * - Current playback state (playing/paused)
 * - Current time position in the track
 * - Volume level
 * - Player visibility
 * - Stream URIs
 * - Error state
 * - Fullscreen mode
 * - Peer streaming state
 * 
 * This state is local-only and not synced via LiveStore.
 * For persistent queue/playlist state, use LiveStore queries.
 */

export type PlaybackState = {
  // Playback control
  playing: boolean
  duration: number
  currentTime: number
  volume: number
  
  // UI state
  showPlayer: boolean
  fullscreen: boolean
  
  // Streaming
  streamUri: string | null
  streams: Record<string, unknown>
  
  // Error handling
  errorCount: number
  
  // Peer streaming
  peerStreaming: {
    isStreaming: boolean
    peerId: string | null
  }
}

export type PlaybackActions = {
  // Playback controls
  play: () => void
  pause: () => void
  stop: () => void
  togglePlaying: () => void
  
  // Time/duration
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  
  // Volume
  setVolume: (volume: number) => void
  
  // Player visibility
  setShowPlayer: (show: boolean) => void
  
  // Streaming
  setStreamUri: (uri: string | null) => void
  setStreams: (streams: Record<string, unknown>) => void
  
  // Error handling
  registerError: () => void
  clearErrors: () => void
  
  // Fullscreen
  toggleFullscreen: (value?: boolean) => void
  
  // Peer streaming
  setPeerStreaming: (isStreaming: boolean, peerId: string | null) => void
}

type PlaybackContextValue = PlaybackState & PlaybackActions

const PlaybackContext = createContext<PlaybackContextValue | undefined>(undefined)

const initialState: PlaybackState = {
  playing: false,
  duration: 0,
  currentTime: 0,
  volume: 100,
  showPlayer: false,
  streamUri: null,
  streams: {},
  errorCount: 0,
  fullscreen: false,
  peerStreaming: {
    isStreaming: false,
    peerId: null,
  },
}

type Props = {
  children: ReactNode
}

export const PlaybackProvider = ({ children }: Props) => {
  const [state, setState] = useState<PlaybackState>(initialState)

  // Playback controls
  const play = useCallback(() => {
    setState(prev => ({ ...prev, playing: true, showPlayer: true }))
  }, [])

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, playing: false }))
  }, [])

  const stop = useCallback(() => {
    setState(prev => ({ ...prev, playing: false }))
  }, [])

  const togglePlaying = useCallback(() => {
    setState(prev => ({ ...prev, playing: !prev.playing }))
  }, [])

  // Time/duration
  const setCurrentTime = useCallback((time: number) => {
    setState(prev => ({ ...prev, currentTime: time }))
  }, [])

  const setDuration = useCallback((duration: number) => {
    setState(prev => ({ ...prev, duration }))
  }, [])

  // Volume
  const setVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume }))
  }, [])

  // Player visibility
  const setShowPlayer = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showPlayer: show }))
  }, [])

  // Streaming
  const setStreamUri = useCallback((uri: string | null) => {
    setState(prev => ({ ...prev, streamUri: uri }))
  }, [])

  const setStreams = useCallback((streams: Record<string, unknown>) => {
    setState(prev => ({ ...prev, streams }))
  }, [])

  // Error handling
  const registerError = useCallback(() => {
    setState(prev => ({ ...prev, errorCount: prev.errorCount + 1 }))
  }, [])

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errorCount: 0 }))
  }, [])

  // Fullscreen
  const toggleFullscreen = useCallback((value?: boolean) => {
    setState(prev => ({
      ...prev,
      fullscreen: value !== undefined ? value : !prev.fullscreen,
    }))
  }, [])

  // Peer streaming
  const setPeerStreaming = useCallback((isStreaming: boolean, peerId: string | null) => {
    setState(prev => ({
      ...prev,
      peerStreaming: { isStreaming, peerId },
    }))
  }, [])

  const value: PlaybackContextValue = {
    ...state,
    play,
    pause,
    stop,
    togglePlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    setShowPlayer,
    setStreamUri,
    setStreams,
    registerError,
    clearErrors,
    toggleFullscreen,
    setPeerStreaming,
  }

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>
}

/**
 * Hook to access playback context
 * @throws Error if used outside PlaybackProvider
 */
export const usePlayback = (): PlaybackContextValue => {
  const context = useContext(PlaybackContext)
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider')
  }
  return context
}
