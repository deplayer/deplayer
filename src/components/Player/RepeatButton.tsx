import { Dispatch } from 'redux'
import * as React from 'react'

import { REPEAT } from '../../constants/ActionTypes'
import Button from '../common/Button'

type Props = {
  dispatch: Dispatch
}

const RepeatButton = (props: Props) => {
  const onClick = () => {
    props.dispatch({type: REPEAT})
  }

  return (
    <Button
      className='back-repeat repeat'
      onClick={onClick}
    >
      <i className='fa fa-repeat'></i>
    </Button>
  )
}

export default RepeatButton
