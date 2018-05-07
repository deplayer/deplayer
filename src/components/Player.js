import React, { Component } from 'react';

export default class Player extends Component {
  constructor(props) {
    super(props)
    this.playerRef = React.createRef()
  }

  componentDidMount() {
    if (this.props.playlist.currentPlaying) {
      this.playerRef.current.play()
    }
  }

  render() {
    const currentPlaying = this.props.playlist.currentPlaying
    return (
      <audio
        ref={this.playerRef}
        src={currentPlaying.file}
        controls
      />
    )
  }
}
