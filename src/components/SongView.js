// @flow

import React, { Component } from 'react'
import Song from '../entities/Song'

type Props = {
  song: Song
}

export default class Track extends Component<Props> {
  render() {
    return (
      <div className='song-view'>
        This is the song view
      </div>
    )
  }
}
