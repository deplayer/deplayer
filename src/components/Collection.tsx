import { Translate } from 'react-redux-i18n'
import { Link, useLocation } from 'react-router-dom'
import AddNewMediaButton from './Buttons/AddNewMediaButton'
import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'
import { Location } from 'react-router'
import EmptyState from './common/EmptyState/index'
import TryDemoButton from './Buttons/TryDemoButton'
import Icon from './common/Icon'
import { useSettings } from '../stores/livestore/hooks'
import { useUI } from '../contexts'
import { useSelector } from 'react-redux'
import { State } from '../reducers'

const mediaForPath = (location: Location, collection: State['collection'], filteredSongs: string[]) => {
  switch (location.pathname) {
    case '/search-results':
      return collection.searchResults
    default:
      return filteredSongs
  }
}

const Collection = () => {
  // Get data from LiveStore hooks and contexts
  const liveSettings = useSettings()
  const { loading } = useUI()
  const location = useLocation()
  
  // Get Redux state for features not yet migrated (filters, search)
  const reduxCollection = useSelector((state: State) => state.collection)
  const filteredSongs = useSelector((state: State) => state.collection.filteredSongs)
  
  if (loading) {
    return <Spinner />
  }

  const mediaItems = mediaForPath(location, reduxCollection, filteredSongs)
  const hasSearchableProviders = liveSettings?.providers ? 
    Object.values(liveSettings.providers).some((provider) => (provider as { enabled?: boolean })?.enabled) : 
    false

  return (
    <div className="collection z-10 flex">
      <div className="flex-1 w-full">
        {!mediaItems.length ? (
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
            tableIds={mediaItems}
            disableCovers={false}
          />
        )}
      </div>
    </div>
  )
}

export default Collection
