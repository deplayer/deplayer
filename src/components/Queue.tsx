import * as React from 'react'
import { Dispatch } from 'redux'

import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'
import BodyMessage from './BodyMessage'
import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'

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
  const trackIds = props.queue.shuffle ? props.queue.randomTrackIds : props.queue.trackIds
  // Is disabled for small screens
  if (props.slim && !props.app.mqlMatch) {
    return null
  }

  // Disabled if theres no songs on queue
  if (props.slim && !trackIds.length) {
    return null
  }

  if (props.slim && !props.app.displayMiniQueue) {
    return null
  }

  if (props.app.loading) {
    return (
      <div className={`queue`}>
        <blockquote className='blockquote'>
          <Spinner />
        </blockquote>
      </div>
    )
  }

  if (!trackIds.length) {
    return (
      <div className={`queue z-10 no-results ${props.className || ''}`}>
        <BodyMessage message={'Add songs from the collection or search for new ones'} />

        <Link
          to="/collection"
          title="collection"
        >
          <Translate value="application.title"/>
          <i className='icon database outline'></i>
        </Link>
      </div>
    )
  }

  return (
    <div className={`queue z-10 ${props.className || ''}`}>
      <MusicTable
        tableIds={trackIds}
        disableCovers={props.slim}
        disableAddButton
        slim={props.slim}
        {...props}
      />
    </div>
  )
}

export default  Queue
