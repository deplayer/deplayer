import * as React from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'

import * as types from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch
}

const SidebarButton = ({dispatch}: Props) => {
  const toggleSidebar = () => {
    dispatch({type: types.TOGGLE_SIDEBAR})
  }

  return (
    <button
      className='button sidebar-button'
      onClick={toggleSidebar}
    >
      <i className="fa fa-bars"></i>
    </button>
  )
}

export default connect()(SidebarButton)
