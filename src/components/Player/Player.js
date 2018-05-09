import React, { Component } from 'react';
import PropTypes from 'prop-types'

// TODO: Fill all events https://www.w3schools.com/tags/ref_av_dom.asp
class Player extends Component {
  state = {
    error: ''
  }

  constructor(props) {
    super(props)
    this.playerRef = React.createRef()
  }

  componentDidMount() {
    if (this.props.playlist.currentPlaying) {
      this.playerRef.current.play()
    }
  }

  logError(ev) {
    this.setState({error: this.playerRef.current.error.message})
  }

  render() {
    const currentPlaying = this.props.playlist.currentPlaying
    return (
      <div>
        <audio
          ref={this.playerRef}
          src={currentPlaying.file}
          onError={this.logError.bind(this)}
          controls
        />
        {this.state.error}
      </div>
    )
  }
}

Player.propTypes = {
  playlist: PropTypes.object.isRequired
}

export default  Player
