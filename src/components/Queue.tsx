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
    return (
      <div className='queue no-results'>
        <blockquote className='blockquote'>
          <p>Add songs from the collection or search for new ones</p>
        </blockquote>
      </div>
    )
  }

  return (
    <div className='queue'>
      <MusicTable
        tableIds={props.queue.trackIds}
        {...props}
      />
    </div>
  )
}

export default  Queue
