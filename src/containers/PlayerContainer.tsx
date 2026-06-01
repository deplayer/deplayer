import { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PlayerControls from '../components/Player/PlayerControls'
import { useLocation } from 'react-router'
import { State } from '../reducers'
import { useQueue, useSettings, useMediaById } from '../stores/livestore/hooks'
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

  // Resolve the active track id from the queue index. Falling back to the
  // last valid id (when streamUri is live but the index briefly goes null
  // during a shuffle toggle) keeps the UI stable. Resolve BEFORE fetching
  // media so we subscribe to one row, not the entire queue.
  const queueId =
    liveQueue?.currentPlaying !== null && liveQueue?.currentPlaying !== undefined
      ? (trackIds[liveQueue.currentPlaying] ?? null)
      : null
  const currentPlayingId =
    queueId ?? (player?.streamUri ? lastValidCurrentPlayingIdRef.current : null)
  if (currentPlayingId) {
    lastValidCurrentPlayingIdRef.current = currentPlayingId
  }
  const currentMedia = useMediaById(currentPlayingId)

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

  // PlayerControls only reads collection.rows[currentPlayingId]. Single-entry
  // map keyed by the active track avoids materializing the queue.
  const collection = {
    rows: currentMedia && currentPlayingId
      ? { [currentPlayingId]: currentMedia }
      : {}
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
