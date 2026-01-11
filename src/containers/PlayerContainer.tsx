import { connect } from 'react-redux'
import PlayerControls from '../components/Player/PlayerControls'
import { useLocation } from 'react-router'
import { State } from '../reducers'
import { useQueue, useSettings } from '../stores/livestore/hooks'
import { defaultState as queueDefaultState } from '../reducers/queue'
import { defaultState as settingsDefaultState } from '../reducers/settings'

const ConnectedPlayer = connect(
  (state: State) => ({
    app: state.app,
    slim: false,
    player: state.player,
    collection: state.collection
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
  
  // Convert LiveStore queue to Redux-compatible format for PlayerControls
  const queue = liveQueue ? {
    trackIds,
    randomTrackIds: parseTrackIds(liveQueue.randomTrackIds),
    currentPlaying: liveQueue.currentPlaying,
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

  return (
    <PlayerControls 
      {...props} 
      location={location}
      queue={queue}
      settings={settings}
      itemCount={trackIds.length}
    />
  )
})

export default ConnectedPlayer
