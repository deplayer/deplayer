import * as React from 'react'
import { Dispatch } from 'redux'

import * as types from '../../constants/ActionTypes'
import SidebarContents from './SidebarContents'
import Sidebar from 'react-sidebar'


type Props = {
  sidebarToggled: boolean,
  collection: any,
  queue: any,
  app: any,
  location: any,
  children: any,
  dispatch: Dispatch
}

type State = {
  sidebarOpen: boolean,
  sidebarDocked: boolean
}

const mql = window.matchMedia(`(min-width: 770px)`)

class MSidebar extends React.Component<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      sidebarDocked: mql.matches,
      sidebarOpen: props.sidebarToggled
    }
  }

  componentWillMount() {
    mql.addListener(this.mediaQueryChanged);
  }

  componentWillReceiveProps() {
    this.setState({
      sidebarDocked: !this.props.sidebarToggled ? mql.matches : false
    })
  }

  componentWillUnmount() {
    mql.removeListener(this.mediaQueryChanged);
  }

  mediaQueryChanged = () => {
    this.setState({
      sidebarDocked: mql.matches, sidebarOpen: this.props.sidebarToggled
    })
  }

  onSetSidebarOpen = (open) => {
    this.props.dispatch({type: types.TOGGLE_SIDEBAR, value: open})
  }

  render() {
    const { children, sidebarToggled, location } = this.props
    const { sidebarDocked } = this.state

    const contents = (
      <SidebarContents
        app={this.props.app}
        location={location}
        collection={this.props.collection}
        queue={this.props.queue}
        onSetSidebarOpen={mql.matches ? () => {} : this.onSetSidebarOpen}
        dispatch={this.props.dispatch}
      />
    )

    return (
      <Sidebar
        sidebar={contents}
        open={sidebarToggled}
        sidebarId='left-sidebar'
        overlayId='left-sidebar-overlay'
        contentId='left-sidebar-content'
        onSetOpen={this.onSetSidebarOpen}
        transitions={true}
        docked={sidebarDocked}
      >
        { children }
      </Sidebar>
    )
  }
}


export default MSidebar
