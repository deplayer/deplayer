// @flow

import React from 'react'
import { Dispatch } from 'redux'

import { CLEAR_QUEUE } from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch
}

const ClearQueueButton = (props: Props) => {
  const clearQueue = () => {
    props.dispatch({type: CLEAR_QUEUE})
  }

  return (
    <button
      className='clearqueue-button button'
      onClick={clearQueue}
    >
      <i className='fa fa-trash'></i>
    </button>
  )
}

export default ClearQueueButton
