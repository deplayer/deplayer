import React, { Component } from 'react';
import PropTypes from 'prop-types'

class PlayistTrack extends Component {
  render() {
    return (
      <div>
        { this.props.label }
      </div>
    )
  }
}


PlayistTrack.propTypes = {
  label: PropTypes.string.isRequired
}

export default  PlayistTrack
