import { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PlayerControls from '../components/Player/PlayerControls'
import { useLocation } from 'react-router'
import { State } from '../reducers'
import { useQueue, useSettings, useMediaMapForIds } from '../stores/livestore/hooks'
import { defaultState as queueDefaultState } from '../reducers/queue'
import { defaultState as settingsDefaultState } from '../reducers/settings'
import { createHtmlPortalNode } from 'react-reverse-portal'

type Props = {
  playerPortal: ReturnType<typeof createHtmlPortalNode>
}

const PlayerContainer = ({ playerPortal }: Props) => {
  const dispatch = useDispatch()
  const app = useSelector((state: State) => state.app)
  const player = useSelector((state: State) => state.player)

  const location = useLocation()
  const liveQueue = useQueue('default')
  const liveSettings = useSettings()

  // Track the last valid currentPlayingId to prevent flickering during state transitions
  const lastValidCurrentPlayingIdRef = useRef<string | null>(null)

  // Parse trackIds from LiveStore queue (can be JSON string or array)
  const parseTrackIds = (ids: string | string[] | null | undefined): string[] => {
    if (!ids) return []
    if (Array.isArray(ids)) return ids
    try {
      return JSON.parse(ids)
    } catch {
      return []
    }
  }

  // Get the active track list based on shuffle state
  const trackIds = liveQueue?.shuffle
    ? parseTrackIds(liveQueue.randomTrackIds)
    : parseTrackIds(liveQueue?.trackIds)

  // ====== OPTIMIZATION: Only load media for queue tracks (not entire library) ======
  // This is much more efficient: load 10-50 queue items instead of 1000+ library items
  const mediaMap = useMediaMapForIds(trackIds)

  // Convert LiveStore queue to Redux-compatible format for PlayerControls
  // IMPORTANT: LiveStore stores currentPlaying as INDEX, but PlayerControls expects TRACK ID
  let currentPlayingId: string | null = null
  if (liveQueue?.currentPlaying !== null && liveQueue?.currentPlaying !== undefined) {
    currentPlayingId = trackIds[liveQueue.currentPlaying] || null
  }

  // DEFENSIVE: If currentPlayingId is temporarily undefined during a state transition
  // (e.g., shuffle toggle), use the last known valid ID to prevent UI flickering
  if (!currentPlayingId && lastValidCurrentPlayingIdRef.current && player?.streamUri) {
    currentPlayingId = lastValidCurrentPlayingIdRef.current
  }

  // Update the ref when we have a valid ID
  if (currentPlayingId) {
    lastValidCurrentPlayingIdRef.current = currentPlayingId
  }

  const queue = liveQueue ? {
    trackIds,
    randomTrackIds: parseTrackIds(liveQueue.randomTrackIds),
    currentPlaying: currentPlayingId,  // Convert index to track ID
    repeat: liveQueue.repeat,
    shuffle: liveQueue.shuffle,
    nextSongId: liveQueue.nextSongId,
    prevSongId: liveQueue.prevSongId
  } : queueDefaultState

  // Convert LiveStore settings to Redux-compatible format
  const settings = liveSettings ? {
    ...settingsDefaultState,
    settings: liveSettings,
  } : settingsDefaultState

  // Create collection object with rows (mediaMap) for PlayerControls
  const collection = {
    rows: mediaMap
  }

  return (
    <PlayerControls
      app={app}
      slim={false}
      player={player}
      playerPortal={playerPortal}
      dispatch={dispatch}
      location={location}
      match={{ params: {} }}
      queue={queue}
      settings={settings}
      collection={collection}
      itemCount={trackIds.length}
    />
  )
}

export default PlayerContainer
