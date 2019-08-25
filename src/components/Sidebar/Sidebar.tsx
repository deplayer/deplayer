import * as React from 'react'
import { Dispatch } from 'redux'

import * as types from '../../constants/ActionTypes'
import SidebarContents from './SidebarContents'
import Sidebar from 'react-sidebar'


type Props = {
  sidebarToggled: boolean,
  mqlMatch: boolean,
  collection: any,
  queue: any,
  app: any,
  location: any,
  children: any,
  dispatch: Dispatch
}

type State = {
  sidebarOpen: boolean
}

class MSidebar extends React.Component<Props, State> {
  onSetSidebarOpen = (open) => {
    const { sidebarToggled, mqlMatch } = this.props
    const docked = mqlMatch && sidebarToggled

    if (!docked) {
      this.props.dispatch({type: types.TOGGLE_SIDEBAR, value: open})
    }
  }

  render() {
    const { children, sidebarToggled, location, mqlMatch } = this.props

    const contents = (
      <SidebarContents
        app={this.props.app}
        location={location}
        collection={this.props.collection}
        queue={this.props.queue}
        onSetSidebarOpen={this.onSetSidebarOpen}
        dispatch={this.props.dispatch}
      />
    )

    const docked = mqlMatch && sidebarToggled

    return (
      <Sidebar
        sidebar={contents}
        open={sidebarToggled}
        sidebarId='left-sidebar'
        overlayId='left-sidebar-overlay'
        contentId='left-sidebar-content'
        onSetOpen={this.onSetSidebarOpen}
        transitions={true}
        docked={docked}
      >
        { children }
      </Sidebar>
    )
  }
}


export default MSidebar
