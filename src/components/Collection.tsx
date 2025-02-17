import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import { Link } from 'react-router-dom'
import AddNewMediaButton from './Buttons/AddNewMediaButton'
import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'
import { useLocation } from 'react-router'
import { Location } from 'react-router'
import EmptyState from './common/EmptyState/index'
import TryDemoButton from './Buttons/TryDemoButton'
import Icon from './common/Icon'
import { State as SettingsState } from '../reducers/settings'

type Props = {
  app: any,
  playlist: any,
  queue: any,
  player: any,
  collection: any,
  settings?: SettingsState,
  filteredSongs: Array<string>,
  dispatch: Dispatch
}

const mediaForPath = (location: Location, props: Props) => {
  switch (location.pathname) {
    case '/search-results':
      return props.collection.searchResults
    default:
      return props.filteredSongs
  }
}

const Collection = (props: Props) => {
  if (props.app.loading) {
    return <Spinner />
  }

  const location = useLocation()
  const mediaItems = mediaForPath(location, props)
  const hasSearchableProviders = props.settings?.settings?.providers ? 
    Object.values(props.settings.settings.providers).some(provider => provider.enabled) : 
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
            {...props}
          />
        )}
      </div>
    </div>
  )
}

export default Collection
