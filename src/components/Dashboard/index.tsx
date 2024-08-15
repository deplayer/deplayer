import { Translate } from 'react-redux-i18n'

import MediaSlider from '../MediaSlider'
import RelatedAlbums from '../RelatedAlbums'
import { State as CollectionState } from '../../reducers/collection'
import AddNewMediaButton from '../Buttons/AddNewMediaButton'
import { Link } from 'react-router-dom'

type Props = {
  collection: CollectionState
}

const WelcomeMessage = () => {
  const images = [
    'record-player.svg',
    'cassete.svg',
    'walkman.svg',
    'discman.svg',
    'headset.svg'
  ]
  const pickImage = () => images[Math.floor(Math.random() * images.length)]
  const randomImage = pickImage()

  return (
    <div className='flex flex-col md:flex-row w-full content-start items-center md:items-start'>
      <img
        className='w-60'
        src={randomImage}
        alt={'Listen you good old music collection with deplayer'}

      />
      <div className='px-6 py-8'>
        <h2 className='text-4xl'>Hi Stranger! Welcome to deplayer</h2>
        <p className='py-4'>
          Access to you good old music library and enjoy it whenever you need it. <br />
          To start using deplayer add some music to your collection, either by
          adding a provider (Subsonic the most tested one)
        </p>
        <ul>
          <li><Link to='/providers' className='text-blue-500'>Setup your media providers</Link></li>
          <li><AddNewMediaButton label="Add new media to your collection" /></li>
          <li><Link to='/collection' className='text-blue-500'>Or go to your collection</Link></li>
        </ul>
      </div>
    </div>
  )
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

  return (
    <div className='z-10 w-full block px-12 mb-12'>
      <WelcomeMessage></WelcomeMessage>
      {!!mediaItems.length &&
        <MediaSlider
          loading={loading}
          title={<Translate value='titles.mostPlayedSongs' />}
          mediaItems={mediaItems.slice(0, MAX_LIST_ITEMS)}
        />}
      {!!slicedAlbums.length && <RelatedAlbums albums={slicedAlbums} />}
    </div>
  )
}

export default Dashboard
