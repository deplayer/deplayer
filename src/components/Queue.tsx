import { Dispatch } from 'redux'

import { Link } from 'react-router-dom'
import { State as CollectionState } from '../reducers/collection'
import BodyMessage from './BodyMessage'
import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'

type Props = {
  queue: any,
  player: any,
  collection: CollectionState,
  dispatch: Dispatch,
  slim?: boolean,
  className?: string,
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
    const message = (
      <div className='flex flex-col'>
        Add songs from the collection or search for new ones

        <Link
          to="/collection"
          title="collection"
        >
          Jump to collection <br />
          <i className='icon database outline'></i>
        </Link>
      </div>
    )

    return (
      <div className={`queue z-10 no-results ${props.className || ''}`}>
        <BodyMessage message={message} />
      </div>
    )
  }

  return (
    <div className={`queue z-10 resize-x ${props.className || ''}`}>
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

export default Queue
