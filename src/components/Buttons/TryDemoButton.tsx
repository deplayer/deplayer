import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import { connect } from 'react-redux'
import Button from '../common/Button'
import defaultMedia from '../../constants/defaultMedia'
import * as types from '../../constants/ActionTypes'
import { useMediaLibrary } from '../../stores/livestore/hooks'
import { getLiveStoreInstance } from '../../App'
import { addMediaBulkAction } from '../../stores/livestore/actions/media'

type Props = {
  dispatch: Dispatch,
}

const TryDemoButton = ({ dispatch }: Props) => {
  const mediaLibrary = useMediaLibrary()
  
  // Only show the button if the collection is completely empty
  if (mediaLibrary.length > 0) {
    return null
  }

  const handleTryDemo = async () => {
    try {
      // Add demo media to LiveStore
      const liveStore = getLiveStoreInstance()
      if (liveStore) {
        await addMediaBulkAction(liveStore, [defaultMedia])
        // Set as current playing
        dispatch({ type: types.SET_CURRENT_PLAYING, songId: defaultMedia.id, media: defaultMedia })
      } else {
        console.warn('[TryDemo] LiveStore not available')
      }
    } catch (error) {
      console.error('[TryDemo] Failed to add demo media:', error)
    }
  }

  return (
    <Button onClick={handleTryDemo} className="btn-primary">
      <Translate value='message.tryDemoSong' />
    </Button>
  )
}

export default connect()(TryDemoButton) 