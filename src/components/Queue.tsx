import * as React from 'react'
import { Dispatch } from 'redux'

import MusicTable from './MusicTable/MusicTable'

type Props = {
  queue: any,
  player: any,
  collection: any,
  dispatch: Dispatch
}

const Queue = (props: Props) => {
  if (!props.queue.trackIds.length) {
    return null
  }

  return (
    <div className='collection'>
      <MusicTable
        tableIds={props.queue.trackIds}
        totalSongs={props.queue.trackIds.length}
        {...props}
      />
    </div>
  )
}

export default  Queue
