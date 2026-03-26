import { Translate } from 'react-redux-i18n'
import { Link } from 'react-router-dom'
import AddNewMediaButton from './Buttons/AddNewMediaButton'
import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'
import EmptyState from './common/EmptyState/index'
import TryDemoButton from './Buttons/TryDemoButton'
import Icon from './common/Icon'
import { useSettings, useCollectionData, useQueue } from '../stores/livestore/hooks'
import { useUIStore } from '../stores/uiStore'
import { getEmptyStateFallback } from './common/EmptyState/emptyStateFallback'

const Collection = () => {
  // Get data from LiveStore hooks and contexts
  const liveSettings = useSettings()
  const loading = useUIStore(s => s.loading)
  
  // ===== OPTIMIZED: Single reactive query that combines filtering + media map =====
  // This prevents the cascade of re-renders from separate queries
  // Performance: Single DB query, single React render, no freeze
  const { ids, map } = useCollectionData()
  
  // Get queue once for MusicTable (performance optimization)
  const queue = useQueue('default')
  
  if (loading) {
    return <Spinner />
  }

  const hasSearchableProviders = liveSettings?.providers ? 
    Object.values(liveSettings.providers).some((provider) => (provider as { enabled?: boolean })?.enabled) : 
    false

  const { action, description } = getEmptyStateFallback([
    {
      condition: hasSearchableProviders,
      action: (
        <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center'>
          <Link to="/search" className="btn btn-primary">
            <Icon icon="faSearch" className="mr-2" />
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
        {!ids.length ? (
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
            queue={queue}
            disableCovers={false}
          />
        )}
      </div>
    </div>
  )
}

export default Collection
