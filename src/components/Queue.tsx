import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'
import EmptyState from './common/EmptyState/index'
import classNames from 'classnames'
import { useQueue, useMediaCount } from '../stores/livestore/hooks'
import { useSettings } from '../stores/livestore/hooks'
import { useUIStore } from '../stores/uiStore'
import { getEmptyStateFallback, collectionStep, searchStep } from './common/EmptyState/emptyStateFallback'

type Props = {
  slim?: boolean,
  className?: string,
}

const Queue = (props: Props) => {
  const { slim, className } = props
  
  // Get data from LiveStore hooks and contexts for Queue logic
  const liveQueue = useQueue('default')
  const liveSettings = useSettings()
  const loading = useUIStore(s => s.loading)
  const mqlMatch = useUIStore(s => s.mqlMatch)
  const displayMiniQueue = useUIStore(s => s.displayMiniQueue)
  
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
  
  // PERF: Use count hook instead of loading entire library
  const mediaCount = useMediaCount()
  const hasCollectionItems = mediaCount > 0
  // MusicTable falls back to per-row useMediaById when no mediaMap is passed;
  // avoids materializing 10k-track queues.
  const hasSearchableProviders = liveSettings?.providers ?
    Object.values(liveSettings.providers).some((provider) => (provider as { enabled?: boolean })?.enabled) :
    false

  const { action: fallbackAction, description: fallbackDescription } = getEmptyStateFallback([
    collectionStep(hasCollectionItems),
    searchStep(hasSearchableProviders),
  ])

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
    return (
      <div className={classNames('queue z-10 no-results', className)}>
        <EmptyState
          icon="faMusic"
          title="message.queueEmpty"
          description={fallbackDescription || 'message.addSongsFromCollection'}
          action={fallbackAction}
        />
      </div>
    )
  }

  return (
    <div className={classNames('queue z-10 resize-x', className)}>
      <MusicTable
        tableIds={trackIds}
        queue={liveQueue}
        disableCovers={slim}
        disableAddButton
        slim={slim}
      />
    </div>
  )
}

export default Queue
