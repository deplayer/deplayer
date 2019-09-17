import * as React from 'react'
import { Dispatch } from 'redux'

import { REPEAT } from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch
}

const RepeatButton = (props: Props) => {
  const onClick = () => {
    props.dispatch({type: REPEAT})
  }

  return (
    <button
      className='back-repeat repeat'
      onClick={onClick}
    >
      <i className='fa fa-repeat'></i>
    </button>
  )
}

export default RepeatButton
