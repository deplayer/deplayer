import React from 'react'
import './styles/App.scss'
import * as portals from 'react-reverse-portal'
import { Provider } from 'react-redux'
import { Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'

import LayoutContainer from './containers/LayoutContainer'
import AddMediaModal from './components/AddMediaModal'
import AlbumContainer from './containers/AlbumContainer'
import ArtistContainer from './containers/ArtistContainer'
import ArtistsContainer from './containers/ArtistsContainer'
import CollectionContainer from './containers/CollectionContainer'
import DashboardContainer from './containers/DashboardContainer'
import PlayerContainer from './containers/PlayerContainer'
import ContextMenuContainer from './containers/ContextMenuContainer'
import PlaylistsContainer from './containers/PlaylistsContainer'
import ProvidersContainer from './containers/ProvidersContainer'
import QueueContainer from './containers/QueueContainer'
import SearchResultsContainer from './containers/SearchResultsContainer'
import SettingsContainer from './containers/SettingsContainer'
import Wiki from './components/Wiki'
import GlobalKeyHandlers from './components/GlobalKeyHandlers'
import configureStore from './store/configureStore'

const appStore = configureStore()

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<LayoutContainer />}>
      <Route exact path="/" component={DashboardContainer} />
      <Route path="/index.html" component={DashboardContainer} />
      <Route path="/queue" component={QueueContainer} />
      <Route path="/playlists" component={PlaylistsContainer} />
      <Route path="/collection" component={CollectionContainer} disableCurrent />
      <Route path="/search-results" component={SearchResultsContainer} />
      <Route path="/song/:id" component={() => <Song playerPortal={playerPortal} />} />
      <Route path="/album/:id" component={AlbumContainer} />
      <Route path="/artist/:id" component={ArtistContainer} />
      <Route path="/artists" component={ArtistsContainer} />
      <Route path="/providers" component={ProvidersContainer} />
      <Route path="/settings" component={SettingsContainer} />
      <Route path="/wiki" component={Wiki} />
    </Route>
  )
)


const App = () => {
  const playerPortal = React.useMemo(() => portals.createHtmlPortalNode(), [])

  return (
    <Provider store={appStore}>
      <React.Fragment>
        <RouterProvider router={router} />
        <ContextMenuContainer />
        <PlayerContainer playerPortal={playerPortal} />
        <AddMediaModal />
        <GlobalKeyHandlers />
      </React.Fragment>
    </Provider>
  )
}

export default App
