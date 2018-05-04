import React, { Component } from 'react';
import { setCurrentPlaying } from '../actions/playlist'

export default class CollectionRow extends Component {
  play() {
    this.props.dispatch(setCurrentPlaying(this.props.song))
  }

  render() {
    return (
      <div>
        { this.props.song.artist }
        { this.props.song.title}
        <button onClick={this.play.bind(this)}>Play</button>
      </div>
    )
  }
}
