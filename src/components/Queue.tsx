import { Dispatch } from 'redux'
import { Link } from 'react-router-dom'
import { State as CollectionState } from '../reducers/collection'
import { State as SettingsState } from '../reducers/settings'
import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'
import EmptyState from './common/EmptyState/index'
import { Translate } from 'react-redux-i18n'
import classNames from 'classnames'
import Icon from './common/Icon/index';

type Props = {
  queue: any,
  player: any,
  collection: CollectionState,
  settings?: SettingsState,
  dispatch: Dispatch,
  slim?: boolean,
  className?: string,
  app: any,
}

type EmptyStateProps = {
  icon: "faMusic" | "faSearch" | "faPlug";
  title: string;
  description: string;
  action: React.ReactNode;
}

const Queue = (props: Props) => {
  const { queue, app, slim, className, collection, settings } = props
  const trackIds = queue.shuffle ? queue.randomTrackIds : queue.trackIds
  const hasCollectionItems = Object.keys(collection.rows).length > 0
  const hasSearchableProviders = settings?.settings?.providers ? 
    Object.values(settings.settings.providers).some(provider => provider.enabled) : 
    false

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
        <EmptyState
          icon="faSpinner"
          title={<Spinner />}
        />
      </div>
    )
  }

  if (!trackIds.length) {
    let emptyStateProps: EmptyStateProps = {
      icon: "faMusic",
      title: "message.queueEmpty",
      description: "message.addSongsFromCollection",
      action: null
    }

    if (hasCollectionItems) {
      emptyStateProps.action = (
        <Link to="/collection" className="btn btn-primary">
          <Icon icon="faDatabase" className="mr-2" />
          <Translate value="message.jumpToCollection" />
        </Link>
      )
    } else if (hasSearchableProviders) {
      emptyStateProps.description = "message.startSearchingForMusic"
      emptyStateProps.action = (
        <Link to="/search" className="btn btn-primary">
          <Icon icon="faSearch" className="mr-2" />
          <Translate value="message.startSearch" />
        </Link>
      )
    } else {
      emptyStateProps.description = "message.addSearchableProvider"
      emptyStateProps.action = (
        <Link to="/settings" className="btn btn-primary">
          <Icon icon="faPlug" className="mr-2" />
          <Translate value="message.addProvider" />
        </Link>
      )
    }

    return (
      <div className={classNames('queue z-10 no-results', className)}>
        <EmptyState {...emptyStateProps} />
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
