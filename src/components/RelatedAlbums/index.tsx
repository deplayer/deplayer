import { Translate } from 'react-redux-i18n'
import HorizontalSlider from '../HorizontalSlider'
import AlbumCover from '../common/AlbumCover'
import IAlbum from '../../entities/Album'

type Props = {
  albums: Array<IAlbum>
}

const RelatedAlbums = (props: Props) => {
  const title = <Translate value='titles.albums' />

  if (!props.albums) return null;

  const Albums = props.albums
    ?.filter((album) => {
      return album.name !== "" // We don't want empty titles
    })
    .map((album) => {
      return (
        <AlbumCover
          key={album.id}
          id={album.id}
          name={album.name}
          cover={{
            thumbnailUrl: album.thumbnailUrl,
            fullUrl: album.thumbnailUrl
          }}
        />
      )
    })

  return (
    <HorizontalSlider
      title={title}
      items={Albums}
    />
  )
}

export default RelatedAlbums
