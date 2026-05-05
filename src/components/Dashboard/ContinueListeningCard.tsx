import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import CoverImage from '../MusicTable/CoverImage'
import Button from '../common/Button'
import Icon from '../common/Icon'
import DashboardCard from './DashboardCard'
import * as types from '../../constants/ActionTypes'
import { useRecentlyPlayed } from '../../stores/livestore/hooks'

const ContinueListeningCard = () => {
  const recentlyPlayed = useRecentlyPlayed(1)
  const dispatch = useDispatch()
  const song = recentlyPlayed[0]

  if (!song) return null

  return (
    <DashboardCard title="Continue Listening" icon="faPlay">
      <div className="flex items-center gap-4">
        <Link to={`/song/${song.id}`} className="w-16 h-16 flex-shrink-0">
          <CoverImage
            cover={song.cover}
            size="thumbnail"
            albumName={song.album?.name || ''}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/song/${song.id}`}>
            <p className="font-medium truncate">{song.title}</p>
            <p className="text-sm opacity-70 truncate">
              {song.artist?.name || song.artistName} — {song.album?.name || song.albumName}
            </p>
          </Link>
        </div>
        <Button
          onClick={() => dispatch({ type: types.PLAY_SONG, songId: song.id })}
          className="btn-circle btn-primary btn-sm"
          aria-label="Play"
        >
          <Icon icon="faPlay" />
        </Button>
      </div>
    </DashboardCard>
  )
}

export default ContinueListeningCard
