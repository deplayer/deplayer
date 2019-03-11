import * as React from 'react'
import { Provider } from 'react-redux'

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
import ClearQueueButton from './components/Buttons/ClearQueueButton'
import BackButton from './components/Buttons/BackButton'

import {
  Router,
  Route,
} from 'react-router-dom'

require('./styles/App.scss')

const appStore = configureStore()

const Home = () => {
  return (
    <React.Fragment>
      <SidebarContainer>
        <PlaylistButton />
        <CollectionButton />
        <SettingsButton />
        <ClearQueueButton />
      </SidebarContainer>

      <QueueContainer />
    </React.Fragment>
  )
}

const Collection = () => {
  return (
    <React.Fragment>
      <SidebarContainer>
        <PlaylistButton />
        <CollectionButton />
        <SettingsButton />
        <PlayAllButton />
      </SidebarContainer>

      <CollectionContainer />
    </React.Fragment>
  )
}

const Settings = () => {
  return (
    <React.Fragment>
      <SidebarContainer>
        <PlaylistButton />
        <CollectionButton />
        <SettingsButton />
      </SidebarContainer>

      <SettingsContainer />
    </React.Fragment>
  )
}

const Song = () => {
  return (
    <React.Fragment>
      <SidebarContainer>
        <PlaylistButton />
        <CollectionButton />
        <SettingsButton />
        <BackButton />
      </SidebarContainer>

      <SongContainer />
    </React.Fragment>
  )
}

class App extends React.Component<any> {
  render() {

    return (
      <Provider store={appStore}>
        <Router history={history} >
          <React.Fragment>
            <Route exact path="/" component={Home} />
            <Route path="/index.html" component={Home} />
            <Route path="/collection" component={Collection} />
            <Route path="/search-results" component={Collection} />
            <Route path="/song/:id" component={Song} />
            <Route path="/settings" component={Settings} />
            <PlayerContainer />
          </React.Fragment>
        </Router>
      </Provider>
    )
  }
}

export default App
