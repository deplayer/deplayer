import React, { Component } from 'react';
import Audio from 'react-audioplayer';

export default class Player extends Component {
  render() {
    if (!this.props.tracks.length) {
      return <div>No tracks found</div>
    }

    const playlist = this.props.tracks.map((track) => {
      return {
        name: track,
        src: this.props.urlBase + track,
        img: 'http://via.placeholder.com/600x600'
      }
    })

    return (
      <Audio
        fullPlayer={true}
        playlist={playlist}
      />
    )
  }
}
