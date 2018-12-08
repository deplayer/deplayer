// @flow

import React from 'react';
import { Dispatch } from 'redux'

import MusicTable from './MusicTable/MusicTable'

type Props = {
  playlist: any,
  player: any,
  queue: any,
  collection: any,
  dispatch: Dispatch
}

const Playlist = (props: Props) => {
  if (!props.playlist.trackIds.length) {
    return null
  }

  return (
    <div className='collection'>
      <MusicTable
        tableIds={props.playlist.trackIds}
        queue={props.queue}
        totalSongs={props.playlist.trackIds.length}
        {...props}
      />
    </div>
  )
}

export default  Playlist
