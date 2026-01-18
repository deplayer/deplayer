import { Translate } from 'react-redux-i18n'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import AddNewMediaButton from './Buttons/AddNewMediaButton'
import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'
import EmptyState from './common/EmptyState/index'
import TryDemoButton from './Buttons/TryDemoButton'
import Icon from './common/Icon'
import { useSettings, useCollectionData, useQueue } from '../stores/livestore/hooks'
import { useUI } from '../contexts'

const Collection = () => {
  // Get data from LiveStore hooks and contexts
  const liveSettings = useSettings()
  const { loading, activeFilters, searchTerm } = useUI()
  
  // ===== OPTIMIZED: Single reactive query that combines filtering + media map =====
  // This prevents the cascade of re-renders from separate queries
  // Performance: Single DB query, single React render, no freeze
  const { ids, map } = useCollectionData(activeFilters, searchTerm)
  
  // 🔍 DEBUG: Track when data arrives and component renders
  useEffect(() => {
    if (ids.length > 0) {
      const renderStart = performance.now()
      console.log(`[Collection] 📦 Received ${ids.length} IDs, preparing to render MusicTable`)
      
      // Measure when React actually finishes rendering (next frame)
      requestAnimationFrame(() => {
        const renderTime = performance.now() - renderStart
        console.log(`[Collection] 🎨 MusicTable render initiated in ${renderTime.toFixed(2)}ms`)
      })
    }
  }, [ids.length])
  
  // Get queue once for MusicTable (performance optimization)
  const queue = useQueue('default')
  
  if (loading) {
    return <Spinner />
  }

  const hasSearchableProviders = liveSettings?.providers ? 
    Object.values(liveSettings.providers).some((provider) => (provider as { enabled?: boolean })?.enabled) : 
    false

  return (
    <div className="collection z-10 flex">
      <div className="flex-1 w-full">
        {!ids.length ? (
          <EmptyState
            icon={hasSearchableProviders ? "faSearch" : "faPlug"}
            title="message.noCollectionItems"
            description={hasSearchableProviders ? "message.startSearchingForMusic" : "message.addSearchableProvider"}
            action={
              hasSearchableProviders ? (
                <div className='flex space-x-4 items-center justify-center'>
                  <Link to="/search" className="btn btn-primary">
                    <Icon icon="faSearch" className="mr-2" />
                    <Translate value="message.startSearch" />
                  </Link>
                  <AddNewMediaButton />
                  <TryDemoButton />
                </div>
              ) : (
                <Link to="/settings" className="btn btn-primary">
                  <Icon icon="faPlug" className="mr-2" />
                  <Translate value="message.addProvider" />
                </Link>
              )
            }
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
