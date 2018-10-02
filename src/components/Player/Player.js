// @flow

import React, { Component } from 'react'

import ProgressBar from './ProgressBar'

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
  playerRef: { current: null | HTMLMediaElement }

  constructor(props: Props) {
    super(props)
    this.playerRef = React.createRef()
  }

  logError(ev) {
    this.setState({
      error: this.playerRef.current.error.message
    })
  }

  render() {
    const currentPlaying = this.props.playlist.currentPlaying || {}
    // Getting the first stream URI
    const streamUri = currentPlaying
      && currentPlaying.stream
      && currentPlaying.stream.length ?
      currentPlaying.stream[0].uris[0].uri: null

    return (
      <div className='player'>
        <ProgressBar
          total={currentPlaying.duration}
          current={this.playerRef && this.playerRef.current ? this.playerRef.current.currentTime: 0}
        />
        <audio
          ref={this.playerRef}
          src={streamUri}
          onError={this.logError.bind(this)}
          autoPlay={ this.props.playlist.playing }
          controls
        />
        {this.state.error}
      </div>
    )
  }
}

export default Player
