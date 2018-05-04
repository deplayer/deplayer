import React, { Component } from 'react';

export default class CollectionRow extends Component {
  render() {
    return (
      <div>
        { this.props.song.artist }
        { this.props.song.title}
        <button>Play</button>
      </div>
    )
  }
}
