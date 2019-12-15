import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'

import AddNewMediaButton from './Buttons/AddNewMediaButton'
import BodyMessage from './BodyMessage'
import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'

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
      <div className={`collection z-10`}>
        <blockquote className='blockquote'>
          <Spinner />
        </blockquote>
      </div>
    )
  }

  if (!props.visibleSongs.length) {
    return (
        <BodyMessage message={
          <div>
            <Translate value='message.noCollectionItems' />
            <AddNewMediaButton />
          </div>
        }/>
    )
  }

  return (
    <div
      className='collection z-10'
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
