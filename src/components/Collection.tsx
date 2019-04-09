import * as React from 'react'
import { Dispatch } from 'redux'

import MusicTable from './MusicTable/MusicTable'

type Props = {
  playlist: any,
  queue: any,
  player: any,
  collection: any,
  visibleSongs: Array<string>,
  dispatch: Dispatch
}

const Collection = (props: Props) => {
  if (!props.visibleSongs.length) {
    return null
  }

  return (
    <div
      className='collection'
    >
      <MusicTable
        queue={props.queue}
        tableIds={props.visibleSongs}
        disableAddButton
        disableCovers={false}
        {...props}
      />
    </div>
  )
}

export default Collection
