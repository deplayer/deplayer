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
import SongContainer from './containers/SongContainer'
import Wiki from './components/Wiki'
import GlobalKeyHandlers from './components/GlobalKeyHandlers'
import configureStore from './store/configureStore'

const appStore = configureStore()

const Song = () => {
  const playerPortal = React.useMemo(() => portals.createHtmlPortalNode(), [])

  return (
    <React.Fragment>
      <QueueContainer slim className='slim' />
      <SongContainer playerPortal={playerPortal} />
    </React.Fragment>
  )
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<LayoutContainer />}>
      <Route path="/" element={<DashboardContainer />} />
      <Route path="/index.html" element={<DashboardContainer />} />
      <Route path="/queue" element={<QueueContainer />} />
      <Route path="/playlists" element={<PlaylistsContainer />} />
      <Route path="/collection" element={<CollectionContainer />} disableCurrent />
      <Route path="/search-results" element={<SearchResultsContainer />} />
      <Route path="/song/:id" element={<Song />} />
      <Route path="/album/:id" element={<AlbumContainer />} />
      <Route path="/artist/:id" element={<ArtistContainer />} />
      <Route path="/artists" element={<ArtistsContainer />} />
      <Route path="/providers" element={<ProvidersContainer />} />
      <Route path="/settings" element={<SettingsContainer />} />
      <Route path="/wiki" element={<Wiki />} />
    </Route>
  )
)


const App = () => {
  const playerPortal = React.useMemo(() => portals.createHtmlPortalNode(), [])

  return (
    <Provider store={appStore}>
      <RouterProvider router={router} />
      <ContextMenuContainer />
      <PlayerContainer playerPortal={playerPortal} />
      <AddMediaModal />
      <GlobalKeyHandlers />
    </Provider>
  )
}

export default App
