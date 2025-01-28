import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import { connect } from 'react-redux'
import Button from '../common/Button'
import defaultMedia from '../../constants/defaultMedia'
import * as types from '../../constants/ActionTypes'
import { State as CollectionState } from '../../reducers/collection'

type Props = {
  dispatch: Dispatch,
  collection: CollectionState
}

const TryDemoButton = ({ dispatch, collection }: Props) => {
  // Only show the button if the collection is completely empty
  if (Object.keys(collection.rows).length > 0) {
    return null
  }

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

export default connect(
  (state: { collection: CollectionState }) => ({
    collection: state.collection
  })
)(TryDemoButton) 