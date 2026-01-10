import { Link } from 'react-router-dom'
import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'
import EmptyState from './common/EmptyState/index'
import { Translate } from 'react-redux-i18n'
import classNames from 'classnames'
import Icon from './common/Icon/index'
import { useQueue } from '../stores/livestore/hooks'
import { useMediaLibrary } from '../stores/livestore/hooks'
import { useSettings } from '../stores/livestore/hooks'
import { useUI } from '../contexts'

type Props = {
  slim?: boolean,
  className?: string,
}

type EmptyStateProps = {
  icon: "faMusic" | "faSearch" | "faPlug";
  title: string;
  description: string;
  action: React.ReactNode;
}

const Queue = (props: Props) => {
  const { slim, className } = props
  
  // Get data from LiveStore hooks and contexts for Queue logic
  const liveQueue = useQueue('default')
  const mediaLibrary = useMediaLibrary()
  const liveSettings = useSettings()
  const { loading, mqlMatch, displayMiniQueue } = useUI()
  
  // Parse trackIds from LiveStore queue (can be JSON string or array)
  const parseTrackIds = (ids: string | string[] | null | undefined): string[] => {
    if (!ids) return []
    if (Array.isArray(ids)) return ids
    try {
      return JSON.parse(ids)
    } catch {
      return []
    }
  }
  
  const trackIds = liveQueue?.shuffle 
    ? parseTrackIds(liveQueue.randomTrackIds)
    : parseTrackIds(liveQueue?.trackIds)
  
  const hasCollectionItems = Array.isArray(mediaLibrary) && mediaLibrary.length > 0
  const hasSearchableProviders = liveSettings?.providers ? 
    Object.values(liveSettings.providers).some((provider) => (provider as { enabled?: boolean })?.enabled) : 
    false

  // Is disabled for small screens
  if (slim && !mqlMatch) {
    return null
  }

  // Disabled if theres no songs on queue
  if (slim && !trackIds.length) {
    return null
  }

  if (slim && !displayMiniQueue) {
    return null
  }

  if (loading) {
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
    const emptyStateProps: EmptyStateProps = {
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
      />
    </div>
  )
}

export default Queue
