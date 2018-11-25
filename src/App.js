// @flow

import React, { Component } from 'react'
import { Provider } from 'react-redux'

import './styles/App.scss'

import PlaylistContainer from './containers/PlaylistContainer'
import CollectionContainer from './containers/CollectionContainer'
import PlayerContainer from './containers/PlayerContainer'
import SearchContainer from './containers/SearchContainer'
import SongContainer from './containers/SongContainer'
import SettingsContainer from './containers/SettingsContainer'
import configureStore from './store/configureStore'
import history from './store/configureHistory'

import {
  Router,
  Route,
} from 'react-router-dom'

const appStore = configureStore()

const Home = () => {
  return (
    <React.Fragment>
      <PlaylistContainer />
    </React.Fragment>
  )
}

class App extends Component<any> {
  render() {

    return (
      <Provider store={appStore}>
        <Router history={history} >
          <React.Fragment>
            <SearchContainer />
            <Route exact path="/" component={Home} />
            <Route path="/collection" component={CollectionContainer} />
            <Route path="/song/:id" component={SongContainer} />
            <Route path="/settings" component={SettingsContainer} />
            <PlayerContainer />
          </React.Fragment>
        </Router>
      </Provider>
    )
  }
}

export default App
