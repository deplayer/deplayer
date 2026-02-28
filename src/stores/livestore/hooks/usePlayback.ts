import { useQuery } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { useCallback, useEffect } from 'react'
import { tables } from '../schema'
import { useMediaById } from './useMedia'
import PlaybackController from '../../../services/PlaybackController'
import { useStore } from '@livestore/react'

/**
 * usePlayback - Central hook for all playback needs
 * 
 * Provides:
 * - Current playback state (track, playing, volume, position)
 * - Queue state (tracks, shuffle, repeat)
 * - Control functions (play, pause, next, prev, seek, setVolume)
 * 
 * This is the SINGLE SOURCE OF TRUTH for playback in the app.
 * All components should use this hook instead of Redux player state.
 */
export function usePlayback() {
  const { store } = useStore()
  
  // Initialize controller with store
  useEffect(() => {
    if (store) {
      PlaybackController.getInstance().initialize(store)
    }
  }, [store])

  // Get playback state from LiveStore
  const playbackQuery = queryDb(
    tables.playback
      .select()
      .where('id', '=', 'default')
      .limit(1)
  )
  const playbackResult = useQuery(playbackQuery)
  const playback = (playbackResult as any[])?.[0] || null

  // Get queue state from LiveStore
  const queueQuery = queryDb(
    tables.queue
      .select()
      .where('id', '=', 'default')
      .limit(1)
  )
  const queueResult = useQuery(queueQuery)
  const queue = (queueResult as any[])?.[0] || null

  // Get current track info
  const currentTrack = useMediaById(playback?.currentTrackId || undefined)

  // Parse queue track IDs
  const parseTrackIds = (ids: any): string[] => {
    if (!ids) return []
    if (Array.isArray(ids)) return ids
    try {
      return JSON.parse(ids)
    } catch {
      return []
    }
  }

  const trackIds = queue?.shuffle
    ? parseTrackIds(queue.randomTrackIds)
    : parseTrackIds(queue?.trackIds)

  // Controller instance - get fresh each render to ensure it's initialized
  const getController = useCallback(() => {
    return PlaybackController.getInstance()
  }, [])

  // Control functions
  const play = useCallback((trackId?: string) => {
    return getController().play(trackId)
  }, [getController])

  const pause = useCallback(() => {
    getController().pause()
  }, [getController])

  const toggle = useCallback(() => {
    return getController().toggle()
  }, [getController])

  const next = useCallback(() => {
    return getController().next()
  }, [getController])

  const prev = useCallback(() => {
    return getController().prev()
  }, [getController])

  const seek = useCallback((seconds: number) => {
    return getController().seek(seconds)
  }, [getController])

  const setVolume = useCallback((volume: number) => {
    return getController().setVolume(volume)
  }, [getController])

  return {
    // Playback state
    currentTrack,
    currentTrackId: playback?.currentTrackId || null,
    streamUri: playback?.streamUri || null,
    isPlaying: playback?.playing ?? false,
    volume: playback?.volume ?? 80,
    position: playback?.position ?? 0,
    duration: playback?.duration ?? 0,

    // Queue state
    queue: trackIds,
    queueIndex: playback?.currentTrackId ? trackIds.indexOf(playback.currentTrackId) : -1,
    shuffle: queue?.shuffle ?? false,
    repeat: queue?.repeat ?? false,

    // Controls
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    setVolume,

    // Audio element (for visualizers)
    audioElement: getController().getAudioElement(),
    
    // Controller ready state
    isReady: getController().isInitialized(),
  }
}
