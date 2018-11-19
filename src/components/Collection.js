// @flow

import React from 'react';
import { Dispatch } from 'redux'

import MusicTable from './MusicTable/MusicTable'

type Props = {
  playlist: any,
  player: any,
  collection: any,
  dispatch: Dispatch
}

const Collection = (props: Props) => {
  if (!props.collection.visibleSongs.length) {
    return null
  }

  return (
    <div className='collection'>
      <MusicTable
        tableIds={props.collection.visibleSongs}
        totalSongs={props.collection.totalRows}
        disableAddButton
        {...props}
      />
    </div>
  )
}

export default Collection
