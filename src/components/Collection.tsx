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

  const tableFor = (tableIds: Array<string>) => {
    return (
      <MusicTable
        app={props.app}
        queue={props.queue}
        tableIds={tableIds}
        disableAddButton
        disableCovers={false}
        {...props}
      />
    )
  }

  return (
    <div
      className='collection z-10'
    >
      <Route path="/search-results" component={() => tableFor(props.visibleSongs) } />
      <Route exact path="/collection" component={() => tableFor(props.visibleSongs) } />
      <Route path="/collection/video" component={() => tableFor(props.collection.mediaByType['video']) } />
      <Route path="/collection/audio" component={() => tableFor(props.collection.mediaByType['audio']) } />
    </div>
  )
}

export default Collection
