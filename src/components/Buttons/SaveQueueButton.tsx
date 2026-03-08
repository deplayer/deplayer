import { Translate } from 'react-redux-i18n'
import Icon from '../common/Icon'
import Button from '../common/Button'
import { useAppStore } from '../../stores/livestore/store'
import { createPlaylistAction } from '../../stores/livestore/actions/playlists'
import { reorderPlaylistAction } from '../../stores/livestore/actions/playlists'
import { useQueue } from '../../stores/livestore/hooks'

type Props = {
  className?: string
}

const SaveQueueButton = (props: Props) => {
  const liveStore = useAppStore()
  const liveQueue = useQueue('default')
  
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
  
  if (!trackIds.length) {
    return null
  }

  const saveQueue = async () => {
    if (!liveStore) return
    
    const playlistName = window.prompt('Set playlist name')
    if (!playlistName) return
    
    try {
      // Create playlist with tracks from queue
      const playlistId = await createPlaylistAction(liveStore, playlistName)
      // Add all tracks to the playlist
      await reorderPlaylistAction(liveStore, playlistId, trackIds)
    } catch (error) {
      console.error('Failed to save queue as playlist:', error)
    }
  }

  return (
    <Button
      transparent
      className={`clearqueue-button button ${props.className || ''}`}
      onClick={saveQueue}
    >
      <Icon icon='faSave' className='mr-2' />
      <Translate className='hidden md:inline' value='buttons.saveAsPlaylist' />
    </Button>
  )
}

export default SaveQueueButton
