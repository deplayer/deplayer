import React from 'react'

import './styles/App.scss'
import 'rc-slider/assets/index.css';
import './tailwind.css'

import * as portals from 'react-reverse-portal'
import { Provider } from 'react-redux'
import { Route, Routes } from 'react-router-dom'
import { HistoryRouter as Router } from "redux-first-history/rr6";

import { register, auth, supportsWebAuthn } from "@lo-fi/webauthn-local-client";

function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('supportsWebAuthn', supportsWebAuthn)
  React.useEffect(() => {
    var regResult = register({});

    console.log('regResult', regResult)
  }, []);


  return (children)
}

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
import { store, history } from './store/configureStore'

const Song = () => {
  const playerPortal = React.useMemo(() => portals.createHtmlPortalNode(), [])

  return (
    <React.Fragment>
      <QueueContainer slim className='slim' />
      <SongContainer playerPortal={playerPortal} />
    </React.Fragment>
  )
}

const App = () => {
  const playerPortal = React.useMemo(() => portals.createHtmlPortalNode(), [])

  return (
    <Provider store={store}>
      <Router history={history}>
        <AuthProvider>
          <LayoutContainer>
            <Routes>
              <Route path="/" element={<DashboardContainer />} />
              <Route path="/index.html" element={<DashboardContainer />} />
              <Route path="/queue" element={<QueueContainer />} />
              <Route path="/playlists" element={<PlaylistsContainer />} />
              <Route path="/collection/*" element={<CollectionContainer />} />
              <Route path="/search-results" element={<SearchResultsContainer />} />
              <Route path="/song/:id" element={<Song />} />
              <Route path="/album/:id" element={<AlbumContainer />} />
              <Route path="/artist/:id" element={<ArtistContainer />} />
              <Route path="/artists" element={<ArtistsContainer />} />
              <Route path="/providers" element={<ProvidersContainer />} />
              <Route path="/settings" element={<SettingsContainer />} />
              <Route path="/wiki" element={<Wiki />} />
            </Routes>
          </LayoutContainer>
        </AuthProvider>
        <ContextMenuContainer />
        <PlayerContainer playerPortal={playerPortal} />
        <AddMediaModal />
        <GlobalKeyHandlers />
      </Router>
    </Provider >
  )
}

export default App
