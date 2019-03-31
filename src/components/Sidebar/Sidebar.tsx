import * as React from 'react'
import { Dispatch } from 'redux'

import * as types from '../../constants/ActionTypes'
import CloseButton from './CloseButton'
import CollectionMenuItem from './CollectionMenuItem'
import SettingsMenuItem from './SettingsMenuItem'
import QueueMenuItem from './QueueMenuItem'

const Sidebar = require('react-sidebar').default;

type ContentProps = {
  dispatch: Dispatch
}

const SidebarContents = (props: ContentProps) => {
  return (
    <div>
      <h4>genar-radio <CloseButton dispatch={props.dispatch} /></h4>
      <ul>
        <li><QueueMenuItem /></li>
        <li><CollectionMenuItem /></li>
        <li><SettingsMenuItem /></li>
      </ul>
    </div>
  )
}

type Props = {
  sidebarToggled: boolean,
  children: any,
  dispatch: Dispatch
}

const MSidebar = (props: Props) => {
  const { children } = props

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
      docked={props.sidebarToggled}
      sidebarId='left-sidebar'
      overlayId='left-sidebar-overlay'
      contentId='left-sidebar-content'
      onSetOpen={onSetSidebarOpen}
    >
      { children }
    </Sidebar>
  )
}


export default MSidebar
