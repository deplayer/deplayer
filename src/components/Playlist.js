import React, { Component } from 'react';
import PropTypes from 'prop-types'
import PlaylistTrack from './PlaylistTrack'

class Playlist extends Component {
  render() {
    const rows = this.props.playlist.tracks.map((track) => {
      return <PlaylistTrack label={track.label} />
    })

    return (
      <div>
        {rows}
      </div>
    )
  }
}

Playlist.propTypes = {
  playlist: PropTypes.object.isRequired
}

export default  Playlist
