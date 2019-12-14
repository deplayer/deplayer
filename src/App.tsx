import * as React from 'react'
import { Provider } from 'react-redux'
import { Route } from 'react-router-dom'
import { ConnectedRouter } from 'connected-react-router'
import './styles/App.scss'
import './App.css'
import 'react-s-alert/dist/s-alert-css-effects/stackslide.css'
import 'react-s-alert/dist/s-alert-default.css'

// Alerts
import Alert from 'react-s-alert'

import QueueContainer from './containers/QueueContainer'
import DashboardContainer from './containers/DashboardContainer'
import PlaylistsContainer from './containers/PlaylistsContainer'
import CollectionContainer from './containers/CollectionContainer'
import SearchResultsContainer from './containers/SearchResultsContainer'
import PlayerContainer from './containers/PlayerContainer'
import SongContainer from './containers/SongContainer'
import ArtistContainer from './containers/ArtistContainer'
import AlbumContainer from './containers/AlbumContainer'
import SettingsContainer from './containers/SettingsContainer'
import ProvidersContainer from './containers/ProvidersContainer'
import ArtistsContainer from './containers/ArtistsContainer'
import LayoutContainer from './containers/LayoutContainer'

import configureStore from './store/configureStore'
import history from './store/configureHistory'

const appStore = configureStore()

const Song = () => {
  return (
    <React.Fragment>
      <QueueContainer slim className='slim' />
      <SongContainer />
    </React.Fragment>
  )
}

class App extends React.Component<any> {
  render() {

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
              <Route path="/song/:id" component={Song} />
              <Route path="/album/:id" component={AlbumContainer} />
              <Route path="/artist/:id" component={ArtistContainer} />
              <Route path="/artists" component={ArtistsContainer} />
              <Route path="/providers" component={ProvidersContainer} />
              <Route path="/settings" component={SettingsContainer} />
            </LayoutContainer>
            <PlayerContainer />
            <Alert stack={{limit: 3}} />
          </React.Fragment>
        </ConnectedRouter>
      </Provider>
    )
  }
}

export default App
