import * as React from 'react'
import { Provider } from 'react-redux'

import QueueContainer from './containers/QueueContainer'
import CollectionContainer from './containers/CollectionContainer'
import SearchResultsContainer from './containers/SearchResultsContainer'
import PlayerContainer from './containers/PlayerContainer'
import Placeholder from './components/Player/Placeholder'
import SidebarContainer from './containers/SidebarContainer'
import TopbarContainer from './containers/TopbarContainer'
import SongContainer from './containers/SongContainer'
import SettingsContainer from './containers/SettingsContainer'
import configureStore from './store/configureStore'
import history from './store/configureHistory'

import SearchButton from './components/Buttons/SearchButton'
import PlayAllButton from './components/Buttons/PlayAllButton'
import ClearQueueButton from './components/Buttons/ClearQueueButton'
import BackButton from './components/Buttons/BackButton'

import {
  Router,
  Route,
} from 'react-router-dom'

require('./styles/App.scss')

const appStore = configureStore()

// TODO: Make a HOC
const Home = () => {
  return (
    <React.Fragment>
      <SidebarContainer>
        <TopbarContainer title='Queue'>
          <SearchButton />
          <ClearQueueButton />
          <PlayAllButton />
        </TopbarContainer>

        <QueueContainer />
        <Placeholder />
      </SidebarContainer>
    </React.Fragment>
  )
}

const Collection = () => {
  return (
    <React.Fragment>
      <SidebarContainer>
        <TopbarContainer title='Collection'>
          <SearchButton />
          <PlayAllButton />
        </TopbarContainer>
        <CollectionContainer />
        <Placeholder />
      </SidebarContainer>
    </React.Fragment>
  )
}

const SearchResults = () => {
  return (
    <React.Fragment>
      <SidebarContainer>
        <TopbarContainer title='Search results'>
          <SearchButton />
          <PlayAllButton />
        </TopbarContainer>
        <SearchResultsContainer />
        <Placeholder />
      </SidebarContainer>
    </React.Fragment>
  )
}

const Settings = () => {
  return (
    <React.Fragment>
      <SidebarContainer>
        <TopbarContainer title='Settings'>
          <SearchButton />
        </TopbarContainer>

        <SettingsContainer />
        <Placeholder />
      </SidebarContainer>
    </React.Fragment>
  )
}

const Song = () => {
  return (
    <React.Fragment>
      <SidebarContainer>
        <TopbarContainer title='song'>
          <SearchButton />
          <BackButton />
        </TopbarContainer>

        <SongContainer />
        <Placeholder />
      </SidebarContainer>
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
            <Route path="/search-results" component={SearchResults} />
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
