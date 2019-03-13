import * as React from 'react'
import { Dispatch } from 'redux'

import * as types from '../../constants/ActionTypes'
import CloseButton from './CloseButton'
import CollectionMenuItem from './CollectionMenuItem'
import SettingsMenuItem from './SettingsMenuItem'
import QueueMenuItem from './QueueMenuItem'

const Sidebar = require('react-sidebar').default;

type Props = {
  sidebarToggled: boolean,
  dispatch: Dispatch
}

type ContentProps = {
  dispatch: Dispatch
}

const SidebarContents = (props: ContentProps) => {
  return (
    <div>
      <CloseButton dispatch={props.dispatch} />

      <ul>
        <li><QueueMenuItem /></li>
        <li><CollectionMenuItem /></li>
        <li><SettingsMenuItem /></li>
      </ul>
    </div>
  )
}

const MSidebar = (props: Props) => {
  const onSetSidebarOpen = (open) => {
    props.dispatch({type: types.TOGGLE_SIDEBAR})
  }

  const contents = (
    <SidebarContents
      dispatch={props.dispatch}
    />
  )

  return (
    <Sidebar
      sidebar={contents}
      open={props.sidebarToggled}
      sidebarId='left-sidebar'
      overlayId='left-sidebar-overlay'
      contentId='left-sidebar-content'
      onSetOpen={onSetSidebarOpen}
    >
      <span style={{display: 'none'}}></span>
    </Sidebar>
  )
}


export default MSidebar
