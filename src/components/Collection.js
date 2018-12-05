// @flow

import React from 'react';
import { Dispatch } from 'redux'

import MusicTable from './MusicTable/MusicTable'

type Props = {
  playlist: any,
  queue: any,
  player: any,
  collection: any,
  dispatch: Dispatch
}

const Collection = (props: Props) => {
  if (!props.collection.visibleSongs.length) {
    return null
  }

  const collectionRef = React.createRef()

  return (
    <div
      className='collection'
      ref={collectionRef}
    >
      <MusicTable
        queue={props.queue}
        tableIds={props.collection.visibleSongs}
        totalSongs={props.collection.totalRows}
        forwardedRef={collectionRef}
        disableAddButton
        {...props}
      />
    </div>
  )
}

export default Collection
