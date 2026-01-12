import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import { connect } from 'react-redux'
import Button from '../common/Button'
import defaultMedia from '../../constants/defaultMedia'
import * as types from '../../constants/ActionTypes'
import { useMediaLibrary } from '../../stores/livestore/hooks'

type Props = {
  dispatch: Dispatch,
}

const TryDemoButton = ({ dispatch }: Props) => {
  const mediaLibrary = useMediaLibrary()
  
  // Only show the button if the collection is completely empty
  if (mediaLibrary.length > 0) {
    return null
  }

  const handleTryDemo = () => {
    // First update the collection state immediately (still needs Redux for now)
    dispatch({ type: types.RECEIVE_COLLECTION, data: [defaultMedia] })
    // Finally set it as current playing
    dispatch({ type: types.SET_CURRENT_PLAYING, songId: defaultMedia.id, media: defaultMedia })
  }

  return (
    <Button onClick={handleTryDemo} className="btn-primary">
      <Translate value='message.tryDemoSong' />
    </Button>
  )
}

export default connect()(TryDemoButton) 