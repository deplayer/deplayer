import { connect } from 'react-redux'
import * as React from 'react'
import SidebarContainer from './SidebarContainer'
import TopbarContainer from './TopbarContainer'
import SearchButton from '../components/Buttons/SearchButton'
import ClearQueueButton from '../components/Buttons/ClearQueueButton'
import PlayAllButton from '../components/Buttons/PlayAllButton'
import Placeholder from '../components/Player/Placeholder'
import { Route } from 'react-router-dom'

const dynamicTitle = (router, collection): string => {
  const songFinder = router.location.pathname.match(/\/song\/(.*)/)

  if (songFinder && songFinder[1]) {
    // const song = collection.rows[songFinder[1]]

    return 'Song'
  }

  switch (router.location.pathname) {
    case '/settings':
      return 'Settings'
    case '/collection':
      return 'Collection'
    case '/artists':
      return 'Artists'
    default:
      return 'Home'
  }
}

type LayoutProps = {
  title: string,
  children: any
}

const Layout = (props: LayoutProps) => {
  return (
    <React.Fragment>
      <SidebarContainer>
        <TopbarContainer title={ props.title }>
          <SearchButton />
          <ClearQueueButton />
          <Route path="/collection" component={() => <PlayAllButton /> } />
          <Route path="/search-results" component={() => <PlayAllButton /> } />
        </TopbarContainer>

        <div className='contents'>
          { props.children }
        </div>
        <Placeholder />
      </SidebarContainer>
    </React.Fragment>
  )
}

export default connect(
  (state) => ({
    title: dynamicTitle(state.router, state.collection),
    queue: state.queue,
    player: state.player,
    collection: state.collection,
    tableIds: Object.keys(state.collection.artists),
    visibleSongs: state.collection.visibleSongs
  })
)(Layout)
