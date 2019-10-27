import { Dispatch } from 'redux'
import * as React from 'react'

import { SHUFFLE } from '../../constants/ActionTypes'
import Button from '../common/Button'

type Props = {
  dispatch: Dispatch
}

const ShuffleButton = (props: Props) => {
  const onClick = () => {
    props.dispatch({type: SHUFFLE})
  }

  return (
    <Button
      className='back-shuffle shuffle'
      onClick={onClick}
    >
      <i className='fa fa-random'></i>
    </Button>
  )
}

export default ShuffleButton
