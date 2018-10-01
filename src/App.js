// @flow

import React, { Component } from 'react'
import { Provider } from 'react-redux'
import { Translate } from 'react-redux-i18n'

import './styles/App.scss'

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
            <div className='app-menu'>
              <Link to="/"><Translate value='menu.home' /></Link>
              <Link to="/search"><Translate value='menu.search' /></Link>
              <Link to="/import"><Translate value='menu.import' /></Link>
              <Link to="/collection"><Translate value='menu.collection' /></Link>
            </div>
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
