import * as React from 'react'
import { Dispatch } from 'redux'

import * as types from '../../constants/ActionTypes'
import CollectionMenuItem from './CollectionMenuItem'
import SettingsMenuItem from './SettingsMenuItem'
import PlaylistsMenuItem from './PlaylistsMenuItem'
import SearchMenuItem from './SearchMenuItem'
import QueueMenuItem from './QueueMenuItem'
import ArtistsMenuItem from './ArtistsMenuItem'
import Sidebar from 'react-sidebar'
import { inSection } from '../../utils/router'

type ContentProps = {
  dispatch: Dispatch,
  collection: any,
  queue: any,
  app: any,
  location: any,
  onSetSidebarOpen: Function
}

const SidebarContents = (props: ContentProps) => {
  return (
    <div onClick={() => props.onSetSidebarOpen()}>
      <h4>genar-radio</h4>
      <ul>
        <QueueMenuItem
          current={inSection(props.location, '(queue)?')}
          totalItems={props.queue.trackIds.length}
        />
        <SearchMenuItem
          current={inSection(props.location, 'search-results')}
          totalItems={props.collection.searchResults.length}
        />
        <PlaylistsMenuItem current={inSection(props.location, 'playlists')} />
        <CollectionMenuItem
          current={inSection(props.location, 'collection')}
          totalItems={props.collection.totalRows}
        />
        <ArtistsMenuItem
          current={inSection(props.location, 'artists')}
          totalItems={Object.keys(props.collection.artists).length}
        />
        <SettingsMenuItem current={inSection(props.location, 'settings')} />
      </ul>

      <section className='sidebar-meta'>
        <a
          href={'https://gitlab.com/gtrias/genar-radio'}
          title="Show me the code"
          target="_blank"
        >
          <i className='fa fa-gitlab' />
        </a>

        <a
          href={'https://gitlab.com/gtrias/genar-radio/tags'}
          title="Show me the code"
          target="_blank"
        >
          { props.app.version }
        </a>

      </section>
    </div>
  )
}

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
        app={this.props.app}
        location={location}
        collection={this.props.collection}
        queue={this.props.queue}
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
