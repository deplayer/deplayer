import React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'

import './styles/App.scss'
import 'rc-slider/assets/index.css';
import './tailwind.css'

import * as portals from 'react-reverse-portal'
import { Route, Routes } from 'react-router-dom'
import { HistoryRouter as Router } from "redux-first-history/rr6";
import { Provider, useSelector } from 'react-redux'
import { store, history } from './store/configureStore'
import { LiveStoreProvider, useStore } from '@livestore/react'
import { adapter, schema, storeId } from './stores/livestore/store'
import BrowserCompatibilityCheck from './components/BrowserCompatibilityCheck'
import { setupFts5 } from './stores/livestore/fts5-setup'
import { setupIndexes } from './stores/livestore/indexes-setup'
import { PlaybackProvider, ThemeProvider, UIProvider, useUI } from './contexts'
import { State } from './reducers'

import LayoutContainer from './containers/LayoutContainer'
import AddMediaModal from './components/AddMediaModal'
import AlbumView from './components/AlbumView'
import ArtistView from './components/ArtistView'
import ArtistTable from './components/ArtistsTable/ArtistTable'
import Collection from './components/Collection'
import Dashboard from './components/Dashboard'
import PlayerContainer from './containers/PlayerContainer'
import ContextMenuContainer from './containers/ContextMenuContainer'
import PlaylistsContainer from './containers/PlaylistsContainer'
import Providers from './components/Providers'
import Settings from './components/Settings/Settings'
import Queue from './components/Queue'
import SongContainer from './containers/SongContainer'
import Wiki from './components/Wiki'
import GlobalKeyHandlers from './components/GlobalKeyHandlers'
import JoinRoom from './pages/JoinRoom';
import { useLanguage } from './hooks/useLanguage'
import { setLiveStoreInstance } from './middleware/livestore'
import type { Store as LiveStore } from '@livestore/livestore'
import PlaybackController from './services/PlaybackController'

// Export LiveStore instance for use in sagas
let liveStoreInstance: LiveStore | null = null

export const getLiveStoreInstance = () => liveStoreInstance

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
  
  // Set LiveStore instance for middleware (once on mount)
  React.useEffect(() => {
    if (liveStore) {
      setLiveStoreInstance(liveStore)
      liveStoreInstance = liveStore  // Also store for saga access
      
      // Initialize PlaybackController with LiveStore
      PlaybackController.getInstance().initialize(liveStore)
      
      // Now that LiveStore is ready, dispatch INITIALIZE action
      // This was moved from configureStore.ts to prevent the
      // "Cannot access 'getLiveStoreInstance' before initialization" error
      store.dispatch({ type: 'INITIALIZE' })
    }
  }, [liveStore])
  
  // Get Redux app state and UI context
  const reduxApp = useSelector((state: State) => state.app)
  const { setLoading, setMqlMatch, setHeightMqlMatch } = useUI()
  
  // Bridge: Sync Redux app state to UIContext during migration
  React.useEffect(() => {
    setLoading(reduxApp.loading)
  }, [reduxApp.loading, setLoading])
  
  React.useEffect(() => {
    setMqlMatch(reduxApp.mqlMatch)
  }, [reduxApp.mqlMatch, setMqlMatch])
  
  React.useEffect(() => {
    setHeightMqlMatch(reduxApp.heightMqlMatch)
  }, [reduxApp.heightMqlMatch, setHeightMqlMatch])
  
  // Initialize FTS5 full-text search and database indexes on mount
  // OPTIMIZED: Defer to idle time to avoid blocking first paint
  React.useEffect(() => {
    if (!liveStore?.sqliteDbWrapper) return
    
    const setupDatabase = () => {
      try {
        // Setup FTS5 (currently disabled due to wa-sqlite limitations)
        setupFts5(liveStore)
        
        // Setup database indexes for performance
        setupIndexes(liveStore)
      } catch (error) {
        console.error('[App] Failed to setup database:', error)
      }
    }
    
    // Use requestIdleCallback to defer index creation until browser is idle
    // Falls back to setTimeout for browsers that don't support it
    if ('requestIdleCallback' in window) {
      const idleId = requestIdleCallback(setupDatabase, { timeout: 2000 })
      return () => cancelIdleCallback(idleId)
    } else {
      const timeoutId = setTimeout(setupDatabase, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [liveStore])

  return (
    <>
      <LayoutContainer>
        <Routes>
          <Route path="/join/:id" element={<JoinRoom />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/index.html" element={<Dashboard />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/playlists" element={<PlaylistsContainer />} />
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
    <BrowserCompatibilityCheck>
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
    </BrowserCompatibilityCheck>
  )
}

export default App
