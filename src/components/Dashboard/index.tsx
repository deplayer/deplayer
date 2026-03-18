import React from 'react'
import { Translate } from 'react-redux-i18n'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import ContinueListeningCard from './ContinueListeningCard'
import StatsCard from './StatsCard'
import RecentAlbums from './RecentAlbums'
import TopThisWeekCard from './TopThisWeekCard'
import GenreChips from './GenreChips'
import BecauseYouListened from '../BecauseYouListened'
import Footer from '../Footer'
import TryDemoButton from '../Buttons/TryDemoButton'
import DashboardCard from './DashboardCard'
import DeplayerTitle from '../DeplayerTitle'
import * as types from '../../constants/ActionTypes'
import { useRecentlyPlayed, useMediaCount } from '../../stores/livestore/hooks'

const WelcomeCard = () => {
  const dispatch = useDispatch()

  return (
    <DashboardCard title="Welcome" icon="faMusic" className="col-span-full">
      <div className="flex flex-col items-center gap-4 py-4">
        <h4 className="text-xl text-center">
          <Translate value="dashboard.welcome.title" dangerousHTML /> <DeplayerTitle />
        </h4>
        <p className="text-center opacity-70">
          <Translate value="dashboard.welcome.description" />
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <TryDemoButton />
          <Link to="/providers" className="btn btn-outline btn-sm">
            <Translate value="dashboard.welcome.setupProviders" />
          </Link>
          <a
            onClick={() => dispatch({ type: types.SHOW_ADD_MEDIA_MODAL })}
            className="btn btn-outline btn-sm cursor-pointer"
          >
            <Translate value="dashboard.welcome.addMedia" />
          </a>
        </div>
      </div>
    </DashboardCard>
  )
}

const Dashboard = () => {
  const mediaCount = useMediaCount()
  const recentlyPlayed = useRecentlyPlayed(1)
  const topArtist = recentlyPlayed[0]

  const artistGenres = React.useMemo(() => {
    if (!topArtist) return []
    const genres = topArtist.genres || (topArtist.genresFlat ? topArtist.genresFlat.split(',') : [])
    return Array.isArray(genres) ? genres.map((g: string) => g.trim()).filter(Boolean) : []
  }, [topArtist])

  const hasLibrary = mediaCount > 0

  return (
    <div className="z-10 w-full md:px-12 mb-12 flex flex-col gap-6 md:gap-10">
      {/* Widget cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-4 md:px-0 pt-4">
        {!hasLibrary && <WelcomeCard />}
        {hasLibrary && <ContinueListeningCard />}
        {hasLibrary && <StatsCard />}
        {hasLibrary && <TopThisWeekCard />}
      </div>

      {/* Recently added albums */}
      {hasLibrary && <RecentAlbums />}

      {/* Because you listened to */}
      {topArtist && artistGenres.length > 0 && (
        <BecauseYouListened
          artistId={topArtist.artistId || topArtist.artist?.id}
          artistName={topArtist.artistName || topArtist.artist?.name || 'Unknown'}
          genres={artistGenres}
        />
      )}

      {/* Genre chips */}
      {hasLibrary && <GenreChips />}

      <Footer />
    </div>
  )
}

export default Dashboard
