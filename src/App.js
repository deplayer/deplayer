// @flow

import React, { Component } from 'react'
import { Provider } from 'react-redux'

import PlaylistContainer from './containers/PlaylistContainer'
import PlayerContainer from './containers/PlayerContainer'
import ImporterContainer from './containers/ImporterContainer'
import CollectionContainer from './containers/CollectionContainer'
import SearchContainer from './containers/SearchContainer'
import configureStore from './store/configureStore'

import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

const appStore = configureStore()

const Home = () => {
  return (
    <React.Fragment>
      <PlaylistContainer />
    </React.Fragment>
  )
}


const CollectionPage = () => {
  return (
    <React.Fragment>
      <CollectionContainer  />
    </React.Fragment>
  )
}

class App extends Component<any> {
  render() {
    return (
      <Provider store={appStore}>
        <Router>
          <React.Fragment>
            <SearchContainer />
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/search">Search</Link></li>
              <li><Link to="/import">Import</Link></li>
              <li><Link to="/collection">Collection</Link></li>
            </ul>
            <Route exact path="/" component={Home} />
            <Route path="/import" component={ImporterContainer} />
            <Route path="/collection" component={CollectionPage} />
            <PlayerContainer />
          </React.Fragment>
        </Router>
      </Provider>
    )
  }
}

export default App
