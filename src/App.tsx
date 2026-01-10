import React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'

import './styles/App.scss'
import 'rc-slider/assets/index.css';
import './tailwind.css'

import * as portals from 'react-reverse-portal'
import { Route, Routes } from 'react-router-dom'
import { HistoryRouter as Router } from "redux-first-history/rr6";
import { Provider } from 'react-redux'
import { store, history } from './store/configureStore'
import { LiveStoreProvider, useStore } from '@livestore/react'
import { adapter, schema, storeId } from './stores/livestore/store'
import { setupFts5 } from './stores/livestore/fts5-setup'
import { PlaybackProvider, ThemeProvider, UIProvider } from './contexts'

import LayoutContainer from './containers/LayoutContainer'
import AddMediaModal from './components/AddMediaModal'
import AlbumContainer from './containers/AlbumContainer'
import ArtistContainer from './containers/ArtistContainer'
import ArtistsContainer from './containers/ArtistsContainer'
import Collection from './components/Collection'
import DashboardContainer from './containers/DashboardContainer'
import PlayerContainer from './containers/PlayerContainer'
import ContextMenuContainer from './containers/ContextMenuContainer'
import PlaylistsContainer from './containers/PlaylistsContainer'
import ProvidersContainer from './containers/ProvidersContainer'
import Queue from './components/Queue'
import SearchResultsContainer from './containers/SearchResultsContainer'
import SettingsContainer from './containers/SettingsContainer'
import SongContainer from './containers/SongContainer'
import Wiki from './components/Wiki'
import GlobalKeyHandlers from './components/GlobalKeyHandlers'
import JoinRoom from './pages/JoinRoom';
import { useLanguage } from './hooks/useLanguage'

interface SongProps {
  playerPortal: portals.HtmlPortalNode
}

const Song = ({ playerPortal }: SongProps) => {
  return (
    <React.Fragment>
      <Queue slim className='slim' />
      <SongContainer playerPortal={playerPortal} />
    </React.Fragment>
  )
}

const AppContent = ({ playerPortal }: { playerPortal: portals.HtmlPortalNode }) => {
  useLanguage()
  
  // Get LiveStore instance
  const { store: liveStore } = useStore()
  
  // Initialize FTS5 full-text search on mount
  React.useEffect(() => {
    if (!liveStore?.sqliteDbWrapper) return
    
    try {
      setupFts5(liveStore)
    } catch (error) {
      console.error('[App] Failed to setup FTS5:', error)
    }
  }, [liveStore])

  return (
    <>
      <LayoutContainer>
        <Routes>
          <Route path="/join/:id" element={<JoinRoom />} />
          <Route path="/" element={<DashboardContainer />} />
          <Route path="/index.html" element={<DashboardContainer />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/playlists" element={<PlaylistsContainer />} />
          <Route path="/collection/*" element={<Collection />} />
          <Route path="/search-results" element={<SearchResultsContainer />} />
          <Route path="/song/:id" element={<Song playerPortal={playerPortal} />} />
          <Route path="/album/:id" element={<AlbumContainer />} />
          <Route path="/artist/:id" element={<ArtistContainer />} />
          <Route path="/artists" element={<ArtistsContainer />} />
          <Route path="/providers" element={<ProvidersContainer />} />
          <Route path="/settings" element={<SettingsContainer />} />
          <Route path="/wiki" element={<Wiki />} />
        </Routes>
      </LayoutContainer>
      <ContextMenuContainer />
      <PlayerContainer playerPortal={playerPortal} />
      <AddMediaModal />
      <GlobalKeyHandlers />
    </>
  )
}

const App = () => {
  const playerPortal = React.useMemo(() => portals.createHtmlPortalNode(), [])

  return (
    <LiveStoreProvider 
      adapter={adapter} 
      schema={schema} 
      storeId={storeId}
      batchUpdates={batchUpdates}
    >
      <ThemeProvider>
        <UIProvider>
          <PlaybackProvider>
            <Provider store={store}>
              <Router history={history}>
                <AppContent playerPortal={playerPortal} />
              </Router>
            </Provider>
          </PlaybackProvider>
        </UIProvider>
      </ThemeProvider>
    </LiveStoreProvider>
  )
}

export default App
