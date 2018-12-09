// @flow

import React, { Component } from 'react'
import { Provider } from 'react-redux'

import './styles/App.scss'

import QueueContainer from './containers/QueueContainer'
import CollectionContainer from './containers/CollectionContainer'
import PlayerContainer from './containers/PlayerContainer'
import SidebarContainer from './containers/SidebarContainer'
import SongContainer from './containers/SongContainer'
import SettingsContainer from './containers/SettingsContainer'
import configureStore from './store/configureStore'
import history from './store/configureHistory'

import PlaylistButton from './components/PlaylistButton'
import CollectionButton from './components/CollectionButton'
import SettingsButton from './components/Buttons/SettingsButton'
import PlayAllButton from './components/Buttons/PlayAllButton'

import {
  Router,
  Route,
} from 'react-router-dom'

const appStore = configureStore()

const Home = () => {
  return (
    <React.Fragment>
      <QueueContainer />
    </React.Fragment>
  )
}

class App extends Component<any> {
  render() {

    return (
      <Provider store={appStore}>
        <Router history={history} >
          <React.Fragment>
            <SidebarContainer>
              <PlaylistButton />
              <CollectionButton />
              <SettingsButton />
              <PlayAllButton
                dispatch={this.props.dispatch}
              />
            </SidebarContainer>
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
