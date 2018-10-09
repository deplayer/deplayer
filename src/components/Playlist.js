// @flow

import React from 'react';
import { Dispatch } from 'redux'

import MusicTable from './MusicTable/MusicTable'

type Props = {
  playlist: any,
  collection: any,
  dispatch: Dispatch
}

const Playlist = (props: Props) => {
  return (
    <div className='collection'>
      <MusicTable {...props} />
    </div>
  )
}

export default  Playlist
