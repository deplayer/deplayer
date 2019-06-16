import * as React from 'react'
import { Dispatch } from 'redux'

import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'
import BodyMessage from './BodyMessage'

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
  if (props.app.loading) {
    return (
      <div className={`collection`}>
        <blockquote className='blockquote'>
          <Spinner />
        </blockquote>
      </div>
    )
  }

  if (!props.visibleSongs.length) {
    return (
      <BodyMessage message={'No songs found'} />
    )
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
