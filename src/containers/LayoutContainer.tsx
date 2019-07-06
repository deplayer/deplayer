import { connect } from 'react-redux'
import * as React from 'react'
import SidebarContainer from './SidebarContainer'
import TopbarContainer from './TopbarContainer'
import SearchButton from '../components/Buttons/SearchButton'
import ClearQueueButton from '../components/Buttons/ClearQueueButton'
import SaveQueueButton from '../components/Buttons/SaveQueueButton'
import PlayAllButton from '../components/Buttons/PlayAllButton'
import Placeholder from '../components/Player/Placeholder'
import { Route } from 'react-router-dom'

const dynamicTitle = (router, collection, searchTerm: ''): string => {
  const songFinder = router.location.pathname.match(/\/song\/(.*)/)
  const artistFinder = router.location.pathname.match(/\/artist\/(.*)/)

  if (songFinder && songFinder[1]) {
    // const song = collection.rows[songFinder[1]]

    return 'Song'
  }

  if (artistFinder && artistFinder[1]) {
    return 'Artist'
  }

  switch (router.location.pathname) {
    case '/settings':
      return 'Settings'
    case '/search-results':
      return 'Search results: ' + searchTerm
    case '/collection':
      return 'Collection'
    case '/artists':
      return 'Artists'
    case '/playlists':
      return 'Playlists'
    default:
      return 'Current playing'
  }
}

type LayoutProps = {
  backgroundImage: string,
  dispatch: any,
  title: string,
  children: any
}

const Layout = (props: LayoutProps) => {
  return (
    <React.Fragment>
      <SidebarContainer>
        <TopbarContainer title={ props.title }>
          <SearchButton />
          <Route path="/queue" component={() => <ClearQueueButton dispatch={props.dispatch} /> } />
          <Route path="/queue" component={() => <SaveQueueButton /> } />
          <Route path="/" component={() => <PlayAllButton dispatch={props.dispatch} /> } />
        </TopbarContainer>

        <div
          style={{backgroundImage: `url(${ props.backgroundImage })`}}
          className='contents'
        >
          { props.children }
        </div>
        <Placeholder />
      </SidebarContainer>
    </React.Fragment>
  )
}

export default connect(
  (state) => ({
    title: dynamicTitle(state.router, state.collection, state.search.searchTerm),
    backgroundImage: state.app.backgroundImage,
    queue: state.queue,
    player: state.player,
    collection: state.collection,
    tableIds: Object.keys(state.collection.artists),
    visibleSongs: state.collection.visibleSongs
  })
)(Layout)
