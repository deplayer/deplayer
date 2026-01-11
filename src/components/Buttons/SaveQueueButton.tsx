import { Translate } from 'react-redux-i18n'
import { connect } from 'react-redux'
import Icon from '../common/Icon'
import Button from '../common/Button'
import { useStore } from '@livestore/react'
import { createPlaylistAction } from '../../stores/livestore/actions/playlists'
import { reorderPlaylistAction } from '../../stores/livestore/actions/playlists'

type Props = {
  queue: any,
  className?: string
}

const SaveQueueButton = (props: Props) => {
  const { store: liveStore } = useStore()
  const trackIds = props.queue.shuffle ? props.queue.randomTrackIds : props.queue.trackIds
  
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

export default connect(
  (state: { queue: any }) => ({
    queue: state.queue
  })
)(SaveQueueButton)
