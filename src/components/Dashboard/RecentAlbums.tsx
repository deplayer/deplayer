import { Translate } from 'react-redux-i18n'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import CoverImage from '../MusicTable/CoverImage'
import HorizontalSlider from '../HorizontalSlider'
import { State as RootState } from '../../reducers'

const AlbumCover = ({ album }: { album: any }) => {
  if (!album.cover) {
    return null
  }

  return (
    <div className='flex items-start rounded justify-center w-32 h-60 mx-4'>
      <Link to={`/album/${album.id}`} className='flex flex-col items-start justify-center'>
        <div className='h-32 w-32'>
          <CoverImage
            reflect
            albumName={album.name}
            useImage
            cover={{
              thumbnailUrl: album.cover.thumbnailUrl,
              fullUrl: album.cover.thumbnailUrl
            }}
          />
        </div>
        <p className='py-4 whitespace-normal text-center truncate inline w-full'>
          {album.name}
        </p>
        <p className='text-sm opacity-70 text-center truncate inline w-full'>
          {album.artistName}
        </p>
      </Link>
    </div>
  )
}

const AlbumMediaSlider = ({ mediaItems, loading, title }: { mediaItems: any[], loading: boolean, title: React.ReactNode }) => {
  if (!mediaItems.length) {
    return null
  }

  const albumItems = mediaItems.map((album) => (
    <AlbumCover
      key={album.id}
      album={album}
    />
  ))

  return (
    <HorizontalSlider
      title={title}
      items={albumItems}
    />
  )
}

const RecentAlbums = () => {
  const recentAlbums = useSelector((state: RootState) => state.collection.recentAlbums || [])

  if (!recentAlbums.length) {
    return null
  }

  return (
    <AlbumMediaSlider
      loading={false}
      title={<Translate value="dashboard.recentlyAdded" />}
      mediaItems={recentAlbums}
    />
  )
}

export default RecentAlbums 