import * as React from 'react'
import { Dispatch } from 'redux'

import MusicTable from './MusicTable/MusicTable'

type Props = {
  app: any,
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
        app={props.app}
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
