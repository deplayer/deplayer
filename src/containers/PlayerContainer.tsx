import { useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PlayerControls from '../components/Player/PlayerControls'
import { useLocation } from 'react-router'
import { State } from '../reducers'
import { useQueue, useSettings, useMediaById } from '../stores/livestore/hooks'
import { getActiveTrackIds, resolveCurrentSongId } from '../stores/livestore/queue'
import { useUIStore } from '../stores/uiStore'
import { defaultState as settingsDefaultState } from '../reducers/settings'
import type { HtmlPortalNode } from 'react-reverse-portal'

type Props = {
  playerPortal: HtmlPortalNode
}

// Stable identity so PlayerControls does not re-render on container re-renders
const STATIC_MATCH = { params: {} }

const PlayerContainer = ({ playerPortal }: Props) => {
  const dispatch = useDispatch()
  const player = useSelector((state: State) => state.player)

  const showVisuals = useUIStore((s) => s.showVisuals)
  const showSpectrum = useUIStore((s) => s.showSpectrum)
  const mqlMatch = useUIStore((s) => s.mqlMatch)

  const location = useLocation()
  const liveQueue = useQueue('default')
  const liveSettings = useSettings()

  // Track the last valid currentPlayingId to prevent flickering during state transitions
  const lastValidCurrentPlayingIdRef = useRef<string | null>(null)

  // Get the active track list based on shuffle state
  const trackIds = useMemo(() => getActiveTrackIds(liveQueue), [liveQueue])

  // Resolve the active track id using the shared persisted-ID-first resolution.
  // Falling back to the last valid id (when streamUri is live but the index
  // briefly goes null during a shuffle toggle) keeps the UI stable.
  const resolvedId = liveQueue ? resolveCurrentSongId(liveQueue) : null
  const queueId = resolvedId ?? null
  const currentPlayingId =
    queueId ?? (player?.streamUri ? lastValidCurrentPlayingIdRef.current : null)
  if (currentPlayingId) {
    lastValidCurrentPlayingIdRef.current = currentPlayingId
  }
  const currentMedia = useMediaById(currentPlayingId)

  // Pass the module QueueState straight through, with currentTrackId pinned
  // to the resolved active track id (persisted-id-first, with the last-valid
  // fallback). The raw index stays untouched; PlayerControls keys off
  // currentTrackId for its row lookup.
  const queue = useMemo(
    () => (liveQueue ? { ...liveQueue, currentTrackId: currentPlayingId } : null),
    [liveQueue, currentPlayingId]
  )

  // Convert LiveStore settings to Redux-compatible format
  const settings = useMemo(
    () => (liveSettings ? { ...settingsDefaultState, settings: liveSettings } : settingsDefaultState),
    [liveSettings]
  )

  // PlayerControls only reads collection.rows[currentPlayingId]. Single-entry
  // map keyed by the active track avoids materializing the queue.
  const collection = useMemo(
    () => ({
      rows: currentMedia && currentPlayingId
        ? { [currentPlayingId]: currentMedia }
        : {}
    }),
    [currentMedia, currentPlayingId]
  )

  return (
    <PlayerControls
      showVisuals={showVisuals}
      showSpectrum={showSpectrum}
      mqlMatch={mqlMatch}
      slim={false}
      player={player}
      playerPortal={playerPortal}
      dispatch={dispatch}
      location={location}
      match={STATIC_MATCH}
      queue={queue}
      settings={settings}
      collection={collection}
      itemCount={trackIds.length}
    />
  )
}

export default PlayerContainer
