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
import ArtistsContainer from './containers/ArtistsContainer'
import configureStore from './store/configureStore'
import history from './store/configureHistory'

import SearchButton from './components/Buttons/SearchButton'
import PlayAllButton from './components/Buttons/PlayAllButton'
import ClearQueueButton from './components/Buttons/ClearQueueButton'
import BackButton from './components/Buttons/BackButton'

// Alerts
import Alert from 'react-s-alert'

import {
  Router,
  Route,
} from 'react-router-dom'

require('react-s-alert/dist/s-alert-default.css')
require('./styles/App.scss')

const appStore = configureStore()

type LayoutProps = {
  title: string,
  children: any
}

const Layout = (props: LayoutProps) => {
  return (
    <React.Fragment>
      <SidebarContainer>
        <TopbarContainer title={ props.title }>
          <SearchButton />
          <ClearQueueButton />
          <PlayAllButton />
        </TopbarContainer>

        { props.children }
        <Placeholder />
      </SidebarContainer>
    </React.Fragment>
  )
}

// TODO: Make a HOC
const Home = () => {
  return (
    <Layout title='Queue'>
      <QueueContainer />
    </Layout>
  )
}

type AppLayoutProps = {
  title: string,
  children: any
}

const AppLayout = (props: AppLayoutProps) => {
  return (
    <Layout title={props.title}>
      { props.children }
    </Layout>
  )
}

const Artists = () => {
  return (
    <AppLayout title='Artists'>
      <ArtistsContainer />
    </AppLayout>
  )
}

const Collection = () => {
  return (
    <AppLayout title='Collection'>
      <CollectionContainer />
    </AppLayout>
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
              <Route path="/artists" component={Artists} />
              <Route path="/settings" component={Settings} />
              <PlayerContainer />
              <Alert stack={{limit: 3}} />
          </React.Fragment>
        </Router>
      </Provider>
    )
  }
}

export default App
