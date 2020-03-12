import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'
import { Route } from 'react-router-dom'

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
      <Route exact path="/collection" component={() =>
        <MusicTable
          app={props.app}
          queue={props.queue}
          tableIds={props.visibleSongs}
          disableAddButton
          disableCovers={false}
          {...props}
        />
      } />

      <Route path="/collection/video" component={() =>
        <MusicTable
          app={props.app}
          queue={props.queue}
          tableIds={props.collection.mediaByType['video']}
          disableAddButton
          disableCovers={false}
          {...props}
        />
      } />

      <Route path="/collection/audio" component={() =>
        <MusicTable
          app={props.app}
          queue={props.queue}
          tableIds={props.collection.mediaByType['audio']}
          disableAddButton
          disableCovers={false}
          {...props}
        />
      } />
    </div>
  )
}

export default Collection
