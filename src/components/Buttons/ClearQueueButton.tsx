import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import * as React from 'react'

import { CLEAR_QUEUE } from '../../constants/ActionTypes'
import Button from '../common/Button'

type Props = {
  dispatch: Dispatch,
  queue: any
}

const ClearQueueButton = (props: Props) => {
  if (!props.queue.trackIds.length) {
    return null
  }

  const clearQueue = () => {
    props.dispatch({type: CLEAR_QUEUE})
  }

  return (
    <Button
      transparent
      className='clearqueue-button button'
      onClick={clearQueue}
    >
      <i className='fa fa-trash'></i>
    </Button>
  )
}

export default connect(
  (state: {queue: any}) => ({
    queue: state.queue
  })
)(ClearQueueButton)
