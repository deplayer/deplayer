import React, { Suspense } from 'react'

import './styles/App.scss'
import 'rc-slider/assets/index.css';
import './tailwind.css'

import * as portals from 'react-reverse-portal'
import { Route, Routes } from 'react-router-dom'
import { HistoryRouter as Router } from "redux-first-history/rr6";
import { Provider } from 'react-redux'
import { store, history } from './store/configureStore'
import { StoreRegistry, StoreRegistryProvider } from '@livestore/react'
import { useAppStore } from './stores/livestore/store'
import BrowserCompatibilityCheck from './components/BrowserCompatibilityCheck'
import { ThemeProvider } from './contexts'


import LayoutContainer from './containers/LayoutContainer'
import AddMediaModal from './components/AddMediaModal'
import AlbumView from './components/AlbumView'
import ArtistView from './components/ArtistView'
import ArtistTable from './components/ArtistsTable/ArtistTable'
import Collection from './components/Collection'
import Dashboard from './components/Dashboard'
import PlayerContainer from './containers/PlayerContainer'
import ContextualMenu from './components/Player/ContextualMenu'
import Playlists from './components/Playlists'
import Providers from './components/Providers'
import Settings from './components/Settings/Settings'
import Queue from './components/Queue'
import SongContainer from './containers/SongContainer'
import Wiki from './components/Wiki'
import GlobalKeyHandlers from './components/GlobalKeyHandlers'
import JoinRoom from './pages/JoinRoom';
import { useLanguage } from './hooks/useLanguage'
import { setLiveStoreInstance } from './stores/livestore/accessor'
import { BootStatusSync } from './components/BootStatusSync'

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
  const liveStore = useAppStore()
  
  // Set LiveStore instance for middleware (once on mount)
  if (liveStore) {
    setLiveStoreInstance(liveStore)
    if (typeof window !== 'undefined' && (import.meta.env.DEV || import.meta.env.MODE === 'test')) {
      // Exposed for Playwright e2e + devtools. Dev/test only.
      (window as Window & { __liveStore?: typeof liveStore }).__liveStore = liveStore
    }
    
    // Now that LiveStore is ready, dispatch INITIALIZE action
    // This was moved from configureStore.ts to prevent the
    // "Cannot access 'getLiveStoreInstance' before initialization" error
    store.dispatch({ type: 'INITIALIZE' })
  }


  return (
    <>
      {liveStore && <BootStatusSync />}
      <LayoutContainer>
        <Routes>
          <Route path="/join/:id" element={<JoinRoom />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/index.html" element={<Dashboard />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/collection/*" element={<Collection />} />
          <Route path="/search-results" element={<Collection />} />
          <Route path="/song/:id" element={<Song playerPortal={playerPortal} />} />
          <Route path="/album/:id" element={<AlbumView />} />
          <Route path="/artist/:id" element={<ArtistView />} />
          <Route path="/artists" element={<ArtistTable />} />
          <Route path="/providers" element={<Providers />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/wiki" element={<Wiki />} />
        </Routes>
      </LayoutContainer>
      <div className='flex justify-end items-center' style={{ backgroundColor: 'transparent' }}>
        <ContextualMenu />
      </div>
      <PlayerContainer playerPortal={playerPortal} />
      <AddMediaModal />
      <GlobalKeyHandlers />
    </>
  )
}

const storeRegistry = new StoreRegistry()

const App = () => {
  const playerPortal = React.useMemo(() => portals.createHtmlPortalNode(), [])

  return (
    <BrowserCompatibilityCheck>
      <StoreRegistryProvider storeRegistry={storeRegistry}>
        <Suspense fallback={
          <div className='flex items-center justify-center min-h-screen bg-base-200'>
            <span className='loading loading-spinner loading-lg'></span>
          </div>
        }>
          <ThemeProvider>
            <Provider store={store}>
              <Router history={history}>
                <AppContent playerPortal={playerPortal} />
              </Router>
            </Provider>
          </ThemeProvider>
        </Suspense>
      </StoreRegistryProvider>
    </BrowserCompatibilityCheck>
  )
}

export default App
