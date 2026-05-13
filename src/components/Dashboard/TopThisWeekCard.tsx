import { useDispatch } from 'react-redux'
import DashboardCard from './DashboardCard'
import Icon from '../common/Icon'
import * as types from '../../constants/ActionTypes'
import { useMostPlayed } from '../../stores/livestore/hooks'

const TopThisWeekCard = () => {
  const topSongs = useMostPlayed(5)
  const dispatch = useDispatch()

  if (!topSongs.length) return null

  return (
    <DashboardCard title="Most Played" icon="faHeart" seeAllLink="/collection">
      <div className="flex flex-col gap-2">
        {topSongs.filter((s): s is NonNullable<typeof s> => s !== null).map((song, index) => (
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") dispatch({ type: types.PLAY_SONG, songId: song.id }) }}
            key={song.id}
            className="flex items-center gap-3 py-1 hover:bg-base-300 rounded-lg px-2 cursor-pointer group"
            onClick={() => dispatch({ type: types.PLAY_SONG, songId: song.id })}
          >
            <span className="text-sm opacity-50 w-5 text-right">{index + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{song.title as string}</p>
              <p className="text-xs opacity-70 truncate">{song.artistName as string}</p>
            </div>
            <span className="text-xs opacity-50">{song.playCount as number}×</span>
            <Icon icon="faPlay" className="opacity-0 group-hover:opacity-100 text-primary text-sm" />
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}

export default TopThisWeekCard
