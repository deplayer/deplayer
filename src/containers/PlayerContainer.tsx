import { connect } from 'react-redux'
import PlayerControls from '../components/Player/PlayerControls'
import { useLocation } from 'react-router'
import { State } from '../reducers'
import { useQueue, useSettings, useMediaMapForIds } from '../stores/livestore/hooks'
import { defaultState as queueDefaultState } from '../reducers/queue'
import { defaultState as settingsDefaultState } from '../reducers/settings'

const ConnectedPlayer = connect(
  (state: State) => ({
    app: state.app,
    slim: false,
    player: state.player,
  })
)((props: any) => {
  const location = useLocation()
  const liveQueue = useQueue('default')
  const liveSettings = useSettings()
  
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
  
  const trackIds = liveQueue?.shuffle 
    ? parseTrackIds(liveQueue.randomTrackIds)
    : parseTrackIds(liveQueue?.trackIds)
  
  // ====== OPTIMIZATION: Only load media for queue tracks (not entire library) ======
  // This is much more efficient: load 10-50 queue items instead of 1000+ library items
  const mediaMap = useMediaMapForIds(trackIds)
  
  // Convert LiveStore queue to Redux-compatible format for PlayerControls
  // IMPORTANT: LiveStore stores currentPlaying as INDEX, but PlayerControls expects TRACK ID
  const currentPlayingId = (liveQueue?.currentPlaying !== null && liveQueue?.currentPlaying !== undefined)
    ? trackIds[liveQueue.currentPlaying]
    : null
  
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
    error: "",
    saving: false,
    settings: liveSettings,
    settingsForm: { providers: {}, fields: {} }
  } : settingsDefaultState
  
  // Create collection object with rows (mediaMap) for PlayerControls
  const collection = {
    rows: mediaMap
  }

  return (
    <PlayerControls 
      {...props} 
      location={location}
      queue={queue}
      settings={settings}
      collection={collection}
      itemCount={trackIds.length}
    />
  )
})

export default ConnectedPlayer
