import * as React from 'react'
import { Provider } from 'react-redux'
import { Route } from 'react-router-dom'
import { ConnectedRouter } from 'connected-react-router'

// Alerts
import Alert from 'react-s-alert'

import QueueContainer from './containers/QueueContainer'
import PlaylistsContainer from './containers/PlaylistsContainer'
import CollectionContainer from './containers/CollectionContainer'
import SearchResultsContainer from './containers/SearchResultsContainer'
import PlayerContainer from './containers/PlayerContainer'
import SongContainer from './containers/SongContainer'
import ArtistContainer from './containers/ArtistContainer'
import SettingsContainer from './containers/SettingsContainer'
import ArtistsContainer from './containers/ArtistsContainer'
import LayoutContainer from './containers/LayoutContainer'

import configureStore from './store/configureStore'
import history from './store/configureHistory'

require('react-s-alert/dist/s-alert-default.css')
require('./styles/App.scss')

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
              <Route exact path="/" component={QueueContainer} />
              <Route path="/index.html" component={QueueContainer} />
              <Route path="/queue" component={QueueContainer} />
              <Route path="/playlists" component={PlaylistsContainer} />
              <Route path="/collection" component={CollectionContainer} disableCurrent />
              <Route path="/search-results" component={SearchResultsContainer} />
              <Route path="/song/:id" component={Song} />
              <Route path="/artist/:id" component={ArtistContainer} />
              <Route path="/artists" component={ArtistsContainer} />
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
