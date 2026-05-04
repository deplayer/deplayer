import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import { connect } from 'react-redux'
import Button from '../common/Button'
import * as types from '../../constants/ActionTypes'
import { useMediaCount } from '../../stores/livestore/hooks'
import { getLiveStoreInstance } from '../../App'
import { addMediaBulkAction } from '../../stores/livestore/actions/media'
import { normalizeMedia } from '../../utils/normalizeMedia'

type Props = {
  dispatch: Dispatch,
}

const demoNormalized = normalizeMedia({
  forcedId: 'winamp-demo',
  title: 'Winamp Demo Song',
  artistName: 'Winamp',
  albumName: 'Demo',
  type: 'audio',
  genres: ['Electronic'],
  duration: 0,
  stream: {
    url: {
      service: 'url',
      uris: [{ uri: 'https://archive.org/download/winamp-demo/DEMO.mp3' }],
    },
  },
})

const TryDemoButton = ({ dispatch }: Props) => {
  // PERF: Use count hook instead of loading entire library
  const mediaCount = useMediaCount()

  // Only show the button if the collection is completely empty
  if (mediaCount > 0) {
    return null
  }

  const handleTryDemo = async () => {
    try {
      // Add demo media to LiveStore
      const liveStore = getLiveStoreInstance()
      if (liveStore) {
        await addMediaBulkAction(liveStore, [demoNormalized])
        // Set as current playing
        dispatch({ type: types.SET_CURRENT_PLAYING, songId: demoNormalized.media.id, media: demoNormalized.media })
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
