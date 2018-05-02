import React, { Component } from 'react';
import PlaylistContainer from './containers/PlaylistContainer'
import PlayerContainer from './containers/PlayerContainer'
import { Provider } from 'react-redux'
import configureStore from './store/configureStore'

const appStore = configureStore()

class App extends Component {
  render() {
    return (
      <Provider store={appStore}>
        <div className="App">
          <PlaylistContainer />
          <PlayerContainer />
        </div>
      </Provider>
    );
  }
}

export default App;
