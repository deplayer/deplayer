import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import AddNewMediaButton from './Buttons/AddNewMediaButton'
import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'
import { useLocation } from 'react-router'
import { Location } from 'react-router'
import CenteredMessage from './common/CenteredMessage'
import TryDemoButton from './Buttons/TryDemoButton'
import defaultMedia from '../constants/defaultMedia'
import Button from './common/Button'
import * as types from '../constants/ActionTypes'

type Props = {
  app: any,
  playlist: any,
  queue: any,
  player: any,
  collection: any,
  filteredSongs: Array<string>,
  dispatch: Dispatch
}

const mediaForPath = (location: Location, props: Props) => {
  switch (location.pathname) {
    case '/collection/audio':
      return props.collection.mediaByType['audio']
    case '/collection/video':
      return props.collection.mediaByType['video']
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

  const handleTryDemo = () => {
    // First update the collection state immediately
    props.dispatch({ type: types.RECEIVE_COLLECTION, data: [defaultMedia] })
    // Finally set it as current playing
    props.dispatch({ type: types.SET_CURRENT_PLAYING, songId: defaultMedia.id, media: defaultMedia })
  }

  return (
    <div className="collection z-10 flex">
      <div className="flex-1">
        {!mediaItems.length ? (
          <CenteredMessage>
            <div className='flex flex-col space-y-4'>
              <Translate value='message.noCollectionItems' />
              <div className='flex space-x-4'>
                <AddNewMediaButton />
                <TryDemoButton dispatch={props.dispatch} />
              </div>
            </div>
          </CenteredMessage>
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
