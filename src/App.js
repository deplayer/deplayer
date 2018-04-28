import './App.css';

import React, { Component } from 'react';

import Player from './components/Player';
import Track from './components/Track';
import logo from './logo.svg';

class App extends Component {
  render() {
    const tracks = this.props.files.map((track) => {
      return <Track track={track} />
    })
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <Player urlBase={this.props.urlBase} tracks={this.props.files} />
      </div>
    );
  }
}

export default App;
