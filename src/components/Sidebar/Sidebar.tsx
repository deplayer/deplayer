import * as React from 'react'
import { Dispatch } from 'redux'

import * as types from '../../constants/ActionTypes'
import CloseButton from './CloseButton'
import CollectionMenuItem from './CollectionMenuItem'
import SettingsMenuItem from './SettingsMenuItem'
import QueueMenuItem from './QueueMenuItem'

const Sidebar = require('react-sidebar').default;

type ContentProps = {
  dispatch: Dispatch,
  onSetSidebarOpen: Function
}

const SidebarContents = (props: ContentProps) => {
  return (
    <div onClick={() => props.onSetSidebarOpen()}>
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

type State = {
  sidebarDocked: boolean,
  sidebarOpen: boolean
}

const mql = window.matchMedia(`(min-width: 800px)`)

class MSidebar extends React.Component<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      sidebarDocked: mql.matches,
      sidebarOpen: mql.matches
    }

    this.mediaQueryChanged = this.mediaQueryChanged.bind(this);
    this.onSetSidebarOpen = this.onSetSidebarOpen.bind(this);
  }

  componentWillMount() {
    mql.addListener(this.mediaQueryChanged);
  }

  componentWillUnmount() {
    mql.removeListener(this.mediaQueryChanged);
  }

  mediaQueryChanged() {
    this.setState({ sidebarDocked: mql.matches, sidebarOpen: false });
  }

  onSetSidebarOpen = (open) => {
    this.props.dispatch({type: types.TOGGLE_SIDEBAR})
    this.setState({ sidebarOpen: open });
  }

  render() {
    const { children } = this.props

    const contents = (
      <SidebarContents
        onSetSidebarOpen={this.onSetSidebarOpen}
        dispatch={this.props.dispatch}
      />
    )

    return (
      <Sidebar
        sidebar={contents}
        open={this.props.sidebarToggled}
        sidebarId='left-sidebar'
        overlayId='left-sidebar-overlay'
        contentId='left-sidebar-content'
        onSetOpen={this.onSetSidebarOpen}
        docked={this.state.sidebarDocked}
      >
        { children }
      </Sidebar>
    )
  }
}


export default MSidebar
