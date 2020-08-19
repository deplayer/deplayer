import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'
import { withRouter } from 'react-router-dom'

import AddNewMediaButton from './Buttons/AddNewMediaButton'
import BodyMessage from './BodyMessage'
import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'

type Props = {
  app: any,
  location: any,
  playlist: any,
  queue: any,
  player: any,
  collection: any,
  visibleSongs: Array<string>,
  dispatch: Dispatch
}

const mediaForPath = (props: any) => {
  switch (props.location.pathname) {
    case '/collection/audio':
      return props.collection.mediaByType['audio']
    case '/collection/video':
      return props.collection.mediaByType['video']
    default:
      return props.visibleSongs
  }
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

  const mediaItems = mediaForPath(props)

  if (!mediaItems.length) {
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
        tableIds={mediaItems}
        disableAddButton
        disableCovers={false}
        {...props}
      />
    </div>
  )
}

export default withRouter((props: any) => <Collection {...props} />)
