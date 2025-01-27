import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import Button from '../common/Button'
import defaultMedia from '../../constants/defaultMedia'
import * as types from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch
}

const TryDemoButton = ({ dispatch }: Props) => {
  const handleTryDemo = () => {
    // First update the collection state immediately
    dispatch({ type: types.RECEIVE_COLLECTION, data: [defaultMedia] })
    // Finally set it as current playing
    dispatch({ type: types.SET_CURRENT_PLAYING, songId: defaultMedia.id, media: defaultMedia })
  }

  return (
    <Button onClick={handleTryDemo} className="btn-secondary">
      <Translate value='message.tryDemoSong' />
    </Button>
  )
}

export default TryDemoButton 