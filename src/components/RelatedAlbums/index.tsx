import { Translate } from 'react-redux-i18n'
import HorizontalSlider from '../HorizontalSlider'
import AlbumCover from '../common/AlbumCover'
import type { AlbumRow } from '../../types/media'

type Props = {
  albums: Array<AlbumRow>
}

const TITLE = <Translate value='titles.albums' />

const RelatedAlbums = (props: Props) => {
  if (!props.albums) return null;

  const Albums = props.albums.flatMap((album) => {
    if (album.name === "") return []
    return [
      <AlbumCover
        key={album.id}
        id={album.id}
        name={album.name}
        cover={{
          thumbnailUrl: album.thumbnailUrl || '',
          fullUrl: album.thumbnailUrl || ''
        }}
      />
    ]
  })

  return (
    <HorizontalSlider
      title={TITLE}
      items={Albums}
    />
  )
}

export default RelatedAlbums
