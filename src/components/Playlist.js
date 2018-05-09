import React, { Component } from 'react';
import PropTypes from 'prop-types'
import MusicTable from './MusicTable'

class Playlist extends Component {
  render() {
    return (
      <div className='collection'>
        <MusicTable {...this.props} />
      </div>
    )
  }
}

Playlist.propTypes = {
  data: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  offset: PropTypes.number.isRequired,
  pages: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  dispatch: PropTypes.func.isRequired
}

export default  Playlist
