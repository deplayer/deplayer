import * as React from 'react'
import { Dispatch } from 'redux'

import * as types from '../../constants/ActionTypes'

const Sidebar = require('react-sidebar').default;

type Props = {
  sidebarToggled: boolean,
  dispatch: Dispatch
}

const MSidebar = (props: Props) => {
  const onSetSidebarOpen = (open) => {
    props.dispatch({type: types.TOGGLE_SIDEBAR})
  }

  return (
    <Sidebar
      sidebar={<b>Sidebar content</b>}
      open={props.sidebarToggled}
      sidebarId='left-sidebar'
      onSetOpen={onSetSidebarOpen}
    >
      <span style={{display: 'none'}}></span>
    </Sidebar>
  )
}


export default MSidebar
