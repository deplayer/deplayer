import { Translate } from 'react-redux-i18n'
import HorizontalSlider from '../HorizontalSlider'
import MediaCover from '../common/AlbumCover'
import { useRecommendations } from '../../stores/livestore/hooks/useRecommendations'

type Props = {
  artistId: string
  artistName: string
  genres: string[]
  limit?: number
}

const BecauseYouListened = ({ artistId, artistName, genres, limit = 15 }: Props) => {
  const recommendations = useRecommendations(artistId, artistName, genres, limit)

  if (!recommendations.length) return null

  const items = recommendations
    .filter(item => item && item.id)
    .map(item => (
      <MediaCover
        key={item.id}
        id={item.id}
        name={String(item.title || item.name || 'Unknown')}
        artistName={item.artistName}
        cover={item.cover || { thumbnailUrl: '', fullUrl: '' }}
        type="song"
      />
    ))

  if (!items.length) return null

  const title = (
    <span>
      <Translate value="titles.becauseYouListenedTo" /> {artistName}
    </span>
  )

  return <HorizontalSlider title={title} items={items} />
}

export default BecauseYouListened
