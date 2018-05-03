import React, { Component } from 'react';
import PlaylistContainer from './containers/PlaylistContainer'
import PlayerContainer from './containers/PlayerContainer'
import ImporterContainer from './containers/ImporterContainer'
import { Provider } from 'react-redux'
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

class App extends Component {
  render() {
    return (
      <Provider store={appStore}>
        <Router>
          <div>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/import">Import</Link></li>
            </ul>
            <Route exact path="/" component={Home} />
            <Route path="/import" component={ImporterContainer} />
          </div>
        </Router>
      </Provider>
    );
  }
}

export default App;
