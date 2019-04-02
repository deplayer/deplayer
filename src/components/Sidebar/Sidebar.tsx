import * as React from 'react'
import { Dispatch } from 'redux'

import * as types from '../../constants/ActionTypes'
import CollectionMenuItem from './CollectionMenuItem'
import SettingsMenuItem from './SettingsMenuItem'
import QueueMenuItem from './QueueMenuItem'
import ArtistsMenuItem from './ArtistsMenuItem'
import Sidebar from 'react-sidebar'

type ContentProps = {
  dispatch: Dispatch,
  location: any,
  onSetSidebarOpen: Function
}

const SidebarContents = (props: ContentProps) => {
  const inSection = (section: string) => {
    const pattern = '^/' + section + '$'
    return props.location.pathname.match(new RegExp(pattern)) ? true : false
  }

  return (
    <div onClick={() => props.onSetSidebarOpen()}>
      <h4>genar-radio</h4>
      <ul>
        <li><QueueMenuItem current={inSection('')} /></li>
        <li><CollectionMenuItem current={inSection('collection')} /></li>
        <li><ArtistsMenuItem  current={inSection('artists')} /></li>
        <li><SettingsMenuItem current={inSection('settings')} /></li>
      </ul>

      <section className='sidebar-meta'>
        <a
          href={'https://gitlab.com/gtrias/genar-radio'}
          title="Show me the code"
          target="_blank"
        >
          <i className='fa fa-gitlab' />
        </a>
      </section>
    </div>
  )
}

type Props = {
  sidebarToggled: boolean,
  location: any,
  children: any,
  dispatch: Dispatch
}

type State = {
  sidebarOpen: boolean,
  sidebarDocked: boolean
}

const mql = window.matchMedia(`(min-width: 800px)`)

class MSidebar extends React.Component<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      sidebarDocked: mql.matches,
      sidebarOpen: props.sidebarToggled
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
    this.setState({ sidebarDocked: mql.matches, sidebarOpen: false })
  }

  onSetSidebarOpen = (open) => {
    this.props.dispatch({type: types.TOGGLE_SIDEBAR, value: open})
  }

  render() {
    const { children, sidebarToggled, location } = this.props
    const { sidebarDocked } = this.state

    const contents = (
      <SidebarContents
        location={location}
        onSetSidebarOpen={this.onSetSidebarOpen}
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
        transitions={false}
        docked={sidebarDocked}
      >
        { children }
      </Sidebar>
    )
  }
}


export default MSidebar
