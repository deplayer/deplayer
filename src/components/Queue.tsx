import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'
import { State as CollectionState } from '../reducers/collection'
import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'
import CenteredMessage from './common/CenteredMessage'
import { Translate } from 'react-redux-i18n'
import classNames from 'classnames'
import Icon from './common/Icon/index';

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
  const { queue, app, slim, className } = props
  const trackIds = queue.shuffle ? queue.randomTrackIds : queue.trackIds

  // Is disabled for small screens
  if (slim && !app.mqlMatch) {
    return null
  }

  // Disabled if theres no songs on queue
  if (slim && !trackIds.length) {
    return null
  }

  if (slim && !app.displayMiniQueue) {
    return null
  }

  if (app.loading) {
    return (
      <div className="queue">
        <CenteredMessage>
          <Spinner />
        </CenteredMessage>
      </div>
    )
  }

  if (!trackIds.length) {
    return (
      <div className={classNames('queue z-10 no-results', className)}>
        <CenteredMessage>
          <div className="flex flex-col items-center gap-2">
            <Translate value="message.addSongsFromCollection" />

            <Link
              to="/collection"
              className="flex items-center hover:text-primary"
              aria-label="Go to collection"
            >
              <Translate value="message.jumpToCollection" />
              <Icon icon="faDatabase" className="ml-2" />
            </Link>
          </div>
        </CenteredMessage>
      </div>
    )
  }

  return (
    <div className={classNames('queue z-10 resize-x', className)}>
      <MusicTable
        tableIds={trackIds}
        disableCovers={slim}
        disableAddButton
        slim={slim}
        {...props}
      />
    </div>
  )
}

export default Queue
