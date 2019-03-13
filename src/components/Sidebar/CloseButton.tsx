import * as React from 'react'
import { Dispatch } from 'redux'

import * as types from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch
}

const CloseButton = (props: Props) => {
  const closeSidebar = () => {
    props.dispatch({type: types.TOGGLE_SIDEBAR})
  }
  return (
    <button
      className='close-button button'
      onClick={closeSidebar}
    >
      <i className='fa fa-close'></i>
    </button>
  )
}

export default CloseButton
