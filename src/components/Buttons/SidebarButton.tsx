import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import * as React from 'react'

import Button from '../common/Button'
import * as types from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch
}

const SidebarButton = ({dispatch}: Props) => {
  const toggleSidebar = () => {
    dispatch({type: types.TOGGLE_SIDEBAR})
  }

  return (
    <Button
      transparent
      onClick={toggleSidebar}
    >
      <i className="fa fa-bars"></i>
    </Button>
  )
}

export default connect()(SidebarButton)
