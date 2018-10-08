// @flow

import React, { Component } from 'react'
import { Provider } from 'react-redux'

import './styles/App.scss'

import PlaylistContainer from './containers/PlaylistContainer'
import PlayerContainer from './containers/PlayerContainer'
import ImporterContainer from './containers/ImporterContainer'
import CollectionContainer from './containers/CollectionContainer'
import SearchContainer from './containers/SearchContainer'
import SongContainer from './containers/SongContainer'
import configureStore from './store/configureStore'
import history from './store/configureHistory'

import {
  Router,
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

    const PlaylistButton = (props) => {
      return (
        <Link className='button' to="/">
          <i className='icon folder outline'></i>
        </Link>
      )
    }

    return (
      <Provider store={appStore}>
        <Router history={history} >
          <React.Fragment>
            <div className='sidebar-container'>
              <div className='ui icon buttons library-controls'>
                <PlaylistButton />
              </div>
              <SearchContainer />
            </div>
            <div className='contents-container'>
              <Route exact path="/" component={Home} />
              <Route path="/import" component={ImporterContainer} />
              <Route path="/collection" component={CollectionPage} />
              <Route path="/song/:id" component={SongContainer} />
            </div>
            <div className='player-container'>
              <PlayerContainer />
            </div>
          </React.Fragment>
        </Router>
      </Provider>
    )
  }
}

export default App
