import { Translate } from 'react-redux-i18n'
import { Link } from 'react-router-dom'
import AddNewMediaButton from './Buttons/AddNewMediaButton'
import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'
import EmptyState from './common/EmptyState/index'
import TryDemoButton from './Buttons/TryDemoButton'
import Icon from './common/Icon'
import { useSettings, useCollectionData } from '../stores/livestore/hooks'
import { useUIStore } from '../stores/uiStore'
import { getEmptyStateFallback } from './common/EmptyState/emptyStateFallback'

const Collection = () => {
  // Get data from LiveStore hooks and contexts
  const liveSettings = useSettings()
  const loading = useUIStore(s => s.loading)

  const { ids, map, count, fetching, hasMore, grow, resolveAllIds } = useCollectionData()

  // Spinner gates: app boot, or the very first window of a fresh filter
  // while the count is still unknown (prevents an empty-state flash).
  const awaitingFirstWindow = fetching && ids.length === 0 && count === undefined
  if (loading || awaitingFirstWindow) {
    return <Spinner />
  }

  // Empty means the live count says zero, or a completed fetch found nothing.
  const isEmpty = count === 0 || (!fetching && ids.length === 0)

  const hasSearchableProviders = liveSettings?.providers ?
    Object.values(liveSettings.providers).some((provider) => (provider as { enabled?: boolean })?.enabled) :
    false

  const { action, description } = getEmptyStateFallback([
    {
      condition: hasSearchableProviders,
      action: (
        <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center'>
          <Link to="/search" className="btn btn-primary">
            <Icon icon='faSearch' className="mr-2" />
            <Translate value="message.startSearch" />
          </Link>
          <AddNewMediaButton />
          <TryDemoButton />
        </div>
      ),
      description: 'message.startSearchingForMusic',
    },
  ])

  return (
    <div className="collection z-10 flex">
      <div className="flex-1 w-full">
        {isEmpty ? (
          <EmptyState
            icon={hasSearchableProviders ? "faSearch" : "faPlug"}
            title="message.noCollectionItems"
            description={description}
            action={action}
          />
        ) : (
          <MusicTable
            tableIds={ids}
            mediaMap={map}
            total={count}
            hasMore={hasMore}
            onLoadMore={grow}
            resolveAllIds={resolveAllIds}
            disableCovers={false}
          />
        )}
      </div>
    </div>
  )
}

export default Collection
