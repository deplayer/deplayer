import React, { Component } from 'react';

export default class Player extends Component {
  render() {
    const currentPlaying = this.props.playlist.currentPlaying
    return (
      <audio src={currentPlaying.file} controls />
    )
  }
}
