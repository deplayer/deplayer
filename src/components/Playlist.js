// @flow

import React from 'react';
import { Dispatch } from 'redux'

import MusicTable from './MusicTable'

type Props = {
  data: Array<any>,
  page: number,
  offset: number,
  pages: number,
  total: number,
  playlist: any,
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
