// @flow

import React, { Component } from 'react';

type Props = {
  playlist: any
}

type State = {
  error: string
}

// TODO: Fill all events https://www.w3schools.com/tags/ref_av_dom.asp
class Player extends Component<Props, State> {
  state = {
    error: ''
  }

  constructor(props: any) {
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

export default Player
