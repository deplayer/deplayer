import { Translate } from 'react-redux-i18n'

import BodyMessage from '../BodyMessage'
import MediaSlider from '../MediaSlider'
import RelatedAlbums from '../RelatedAlbums'
import { Link } from 'react-router-dom'
import { State as CollectionState } from '../../reducers/collection'

type Props = {
  collection: CollectionState
}

const Dashboard = ({ collection: { loading, rows, songsByNumberOfPlays, albums } }: Props) => {
  const MAX_LIST_ITEMS = 25

  const mediaItems = songsByNumberOfPlays.map((songId: string) => {
    return rows[songId]
  })

  const slicedAlbums = Object
    .keys(albums)
    .slice(0, MAX_LIST_ITEMS)
    .map((albumId) => albums[albumId])

  if (!slicedAlbums.length && !mediaItems.length) {
    return (
      <BodyMessage message={
        <div>
          Welcome to Deplayer!
          <br />
          <Translate value='message.noMostPlayed' />
          <br />
          <Link to={'/collection'} className='h-32 button'><Translate value='message.goToCollection' /></Link>
        </div>
      } />
    )
  }

  return (
    <div className='z-10 w-full block px-12 mb-12'>
      <div className='flex w-full content-start items-start'>
        <img
          className='w-60'
          src={`/cassete.svg`}
          alt={'Listen you good old music collection with deplayer'}

        />
        <div className='px-6 py-14'>
          <h2 className='text-4xl'>Hi Stranger! Welcome to deplayer</h2>
          <p className='py-4'>
            Access to you good old music library and enjoy it whenever you need it. <br />
          </p>
        </div>
      </div>

      <MediaSlider
        loading={loading}
        title={<Translate value='titles.mostPlayedSongs' />}
        mediaItems={mediaItems.slice(0, MAX_LIST_ITEMS)}
      />
      <RelatedAlbums albums={slicedAlbums} />
    </div>
  )
}

export default Dashboard
