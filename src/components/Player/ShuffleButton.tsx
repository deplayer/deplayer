import * as React from 'react'
import { Dispatch } from 'redux'

import { SHUFFLE } from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch
}

const ShuffleButton = (props: Props) => {
  const onClick = () => {
    props.dispatch({type: SHUFFLE})
  }

  return (
    <button
      className='back-shuffle shuffle'
      onClick={onClick}
    >
      <i className='fa fa-random'></i>
    </button>
  )
}

export default ShuffleButton
