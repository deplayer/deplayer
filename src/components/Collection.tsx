import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import AddNewMediaButton from './Buttons/AddNewMediaButton'
import BodyMessage from './BodyMessage'
import MusicTable from './MusicTable/MusicTable'
import Spinner from './Spinner'
import { useLocation } from 'react-router'
import { Location } from 'react-router'

type Props = {
  app: any,
  playlist: any,
  queue: any,
  player: any,
  collection: any,
  visibleSongs: Array<string>,
  dispatch: Dispatch
}

const mediaForPath = (location: Location, props: Props) => {
  switch (location.pathname) {
    case '/collection/audio':
      return props.collection.mediaByType['audio']
    case '/collection/video':
      return props.collection.mediaByType['video']
    default:
      return props.visibleSongs
  }
}

const Collection = (props: Props) => {
  if (props.app.loading) {
    return <Spinner />
  }

  const location = useLocation()
  const mediaItems = mediaForPath(location, props)

  return (
    <div className="collection z-10 flex">
      <div className="flex-1">
        {!mediaItems.length ? (
          <BodyMessage message={
            <div className='flex flex-col'>
              <Translate value='message.noCollectionItems' />
              <AddNewMediaButton />
            </div>
          } />
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

export default (props: any) => <Collection {...props} />
