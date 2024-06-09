import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import { connect } from 'react-redux'
import Icon from '../common/Icon'

import { CLEAR_QUEUE } from '../../constants/ActionTypes'
import Button from '../common/Button'

type Props = {
  dispatch: Dispatch,
  queue: any
}

const ClearQueueButton = (props: Props) => {
  const trackIds = props.queue.shuffle ? props.queue.randomTrackIds : props.queue.trackIds
  if (!trackIds) {
    return null
  }

  const clearQueue = () => {
    props.dispatch({ type: CLEAR_QUEUE })
  }

  return (
    <Button
      transparent
      className='clearqueue-button button'
      onClick={clearQueue}
    >
      <Icon icon='faTrash' className='mr-2' />
      <Translate className='hidden md:inline' value='buttons.clearQueue' />
    </Button>
  )
}

export default connect(
  (state: { queue: any }) => ({
    queue: state.queue
  })
)(ClearQueueButton)
