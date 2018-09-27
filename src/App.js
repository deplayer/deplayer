// @flow

import React, { Component } from 'react'
import { Provider } from 'react-redux'

import PlaylistContainer from './containers/PlaylistContainer'
import PlayerContainer from './containers/PlayerContainer'
import ImporterContainer from './containers/ImporterContainer'
import CollectionContainer from './containers/CollectionContainer'
import SearchBar from './components/SearchBar/SearchBar'
import configureStore from './store/configureStore'

import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

const appStore = configureStore()

const Home = () => {
  return (
    <div>
      <PlaylistContainer />
      <PlayerContainer />
    </div>
  )
}


const CollectionPage = () => {
  return (
    <div>
      <CollectionContainer  />
      <PlayerContainer />
    </div>
  )
}

const SearchPage = () => {
  return (
    <React.Fragment>
      <SearchBar />
    </React.Fragment>
  )
}

class App extends Component<any> {
  render() {
    return (
      <Provider store={appStore}>
        <Router>
          <div>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/search">Search</Link></li>
              <li><Link to="/import">Import</Link></li>
              <li><Link to="/collection">Collection</Link></li>
            </ul>
            <Route exact path="/" component={Home} />
            <Route path="/search" component={SearchPage} />
            <Route path="/import" component={ImporterContainer} />
            <Route path="/collection" component={CollectionPage} />
          </div>
        </Router>
      </Provider>
    );
  }
}

export default App
