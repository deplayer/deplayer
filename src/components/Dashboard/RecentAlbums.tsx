import { Translate } from 'react-redux-i18n'
import { useSelector } from 'react-redux'
import HorizontalSlider from '../HorizontalSlider'
import { State as RootState } from '../../reducers'
import AlbumCover from '../common/AlbumCover'

const AlbumMediaSlider = ({ mediaItems, title }: { mediaItems: any[], title: React.ReactNode }) => {
  if (!mediaItems?.length) {
    return null
  }

  const albumItems = mediaItems
    .filter(album => album && album.id && album.name) // Filter out invalid albums
    .map((album) => (
      <AlbumCover
        key={album.id}
        id={album.id}
        name={album.name}
        artistName={album.artistName}
        cover={album.cover}
      />
    ))

  if (!albumItems.length) {
    return null
  }

  return (
    <HorizontalSlider
      title={title}
      items={albumItems}
    />
  )
}

const RecentAlbums = () => {
  const recentAlbums = useSelector((state: RootState) => state.collection.recentAlbums || [])

  if (!recentAlbums?.length) {
    return null
  }

  return (
    <AlbumMediaSlider
      title={<Translate value="dashboard.recentlyAdded" />}
      mediaItems={recentAlbums}
    />
  )
}

export default RecentAlbums 