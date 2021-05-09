import 'react-s-alert/dist/s-alert-css-effects/stackslide.css'
import 'react-s-alert/dist/s-alert-default.css'
import 'rc-slider/assets/index.css'

import './styles/App.scss'
import './tailwind.css'

import { ConnectedRouter } from 'connected-react-router'
import { Provider } from 'react-redux'
import { Route } from 'react-router-dom'
import Alert from 'react-s-alert'
import * as React from 'react'
import * as portals from 'react-reverse-portal'

import AddMediaModal from './components/AddMediaModal'
import AlbumContainer from './containers/AlbumContainer'
import ArtistContainer from './containers/ArtistContainer'
import ArtistsContainer from './containers/ArtistsContainer'
import CollectionContainer from './containers/CollectionContainer'
import DashboardContainer from './containers/DashboardContainer'
import LayoutContainer from './containers/LayoutContainer'
import PlayerContainer from './containers/PlayerContainer'
import ContextMenuContainer from './containers/ContextMenuContainer'
import PlaylistsContainer from './containers/PlaylistsContainer'
import ProvidersContainer from './containers/ProvidersContainer'
import QueueContainer from './containers/QueueContainer'
import SearchResultsContainer from './containers/SearchResultsContainer'
import SettingsContainer from './containers/SettingsContainer'
import SongContainer from './containers/SongContainer'
import Wiki from './components/Wiki'
import configureStore from './store/configureStore'
import history from './store/configureHistory'

const appStore = configureStore()

const Song = ({ playerPortal }) => {
  return (
    <React.Fragment>
      <QueueContainer slim className='slim' />
      <SongContainer playerPortal={playerPortal} />
    </React.Fragment>
  )
}

const App = () =>  {
  const playerPortal = React.useMemo(() => portals.createHtmlPortalNode(), [])

  return (
    <Provider store={appStore}>
      <ConnectedRouter history={history} >
        <React.Fragment>
          <LayoutContainer>
            <Route exact path="/" component={DashboardContainer} />
            <Route path="/index.html" component={DashboardContainer} />
            <Route path="/queue" component={QueueContainer} />
            <Route path="/playlists" component={PlaylistsContainer} />
            <Route path="/collection" component={CollectionContainer} disableCurrent />
            <Route path="/search-results" component={SearchResultsContainer} />
            <Route path="/song/:id" component={() => <Song playerPortal={playerPortal}/>} />
            <Route path="/album/:id" component={AlbumContainer} />
            <Route path="/artist/:id" component={ArtistContainer} />
            <Route path="/artists" component={ArtistsContainer} />
            <Route path="/providers" component={ProvidersContainer} />
            <Route path="/settings" component={SettingsContainer} />
            <Route path="/wiki" component={Wiki} />
          </LayoutContainer>
          <ContextMenuContainer />
          <PlayerContainer playerPortal={playerPortal} />
          <AddMediaModal />
          <Alert stack={{limit: 3}} />
        </React.Fragment>
      </ConnectedRouter>
    </Provider>
  )
}

export default App
