import * as React from 'react'
import { Dispatch } from 'redux'

import MusicTable from './MusicTable/MusicTable'

type Props = {
  queue: any,
  player: any,
  collection: any,
  dispatch: Dispatch,
  slim?: boolean,
  className: string|null,
  app: any,
}

const Queue = (props: Props) => {
  // Is disabled for small screens
  if (props.slim && !props.app.mqlMatch) {
    return null
  }

  if (props.slim && !props.queue.trackIds.length) {
    return null
  }

  if (!props.queue.trackIds.length) {
    return (
      <div className={`queue no-results ${props.className || ''}`}>
        <blockquote className='blockquote'>
          <p>Add songs from the collection or search for new ones</p>
        </blockquote>
      </div>
    )
  }

  return (
    <div className={`queue ${props.className || ''}`}>
      <MusicTable
        tableIds={props.queue.trackIds}
        disableCovers={props.slim}
        {...props}
      />
    </div>
  )
}

export default  Queue
