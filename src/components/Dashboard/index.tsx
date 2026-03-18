import React, { FunctionComponent, SVGProps } from 'react'
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
import Auth from '../Auth'
import Button from '../common/Button'
import * as types from '../../constants/ActionTypes'
import { useRecentlyPlayed, useMediaCount } from '../../stores/livestore/hooks'

import RecordPlayerSvg from './record-player.svg?react'
import CasseteSvg from './cassete.svg?react'
import WalkmanSvg from './walkman.svg?react'
import DiscmanSvg from './discman.svg?react'
import HeadsetSvg from './headset.svg?react'
import PhonophoneSvg from './phonophone.svg?react'

const IMAGE_COMPONENTS: FunctionComponent<SVGProps<SVGSVGElement>>[] = [
  RecordPlayerSvg,
  CasseteSvg,
  WalkmanSvg,
  DiscmanSvg,
  HeadsetSvg,
  PhonophoneSvg
]

const pickImage = () => IMAGE_COMPONENTS[Math.floor(Math.random() * IMAGE_COMPONENTS.length)]

const RandomIllustration = () => {
  const ImageComponent = React.useMemo(() => pickImage(), [])
  return <ImageComponent className="w-32 h-auto fill-base-content opacity-80" />
}

const WelcomeCard = () => {
  const dispatch = useDispatch()
  const [showAuthModal, setShowAuthModal] = React.useState(false)
  const credentials = localStorage.getItem('credentials')

  return (
    <DashboardCard title="Welcome" icon="faMusic" className="col-span-full">
      {showAuthModal && <Auth />}
      <div className="flex flex-col md:flex-row items-center gap-6 py-2">
        <RandomIllustration />
        <div className="flex flex-col gap-3 flex-1">
          <h4 className="text-xl">
            <Translate value="dashboard.welcome.title" dangerousHTML /> <DeplayerTitle />
          </h4>
          <p className="opacity-70">
            <Translate value="dashboard.welcome.description" /><br />
            <Translate value="dashboard.welcome.steps" />
          </p>
          <ul className="flex flex-col gap-1">
            <li>
              <Link to="/providers" className="text-primary hover:text-primary-focus">
                <Translate value="dashboard.welcome.setupProviders" />
              </Link>
            </li>
            <li>
              <a onClick={() => dispatch({ type: types.SHOW_ADD_MEDIA_MODAL })} className="text-primary hover:text-primary-focus cursor-pointer">
                <Translate value="dashboard.welcome.addMedia" />
              </a>{' '}
              <Translate value="dashboard.welcome.addMediaDescription" />
            </li>
            <li>
              <Link to="/collection" className="text-primary hover:text-primary-focus">
                <Translate value="dashboard.welcome.goToCollection" />
              </Link>
            </li>
          </ul>
          <div className="flex flex-wrap gap-3 items-center pt-2">
            <TryDemoButton />
            {!credentials && (
              <Button onClick={() => setShowAuthModal(true)}>
                <Translate value="dashboard.welcome.authButton" />
              </Button>
            )}
            {credentials && (
              <span className="text-sm opacity-70">
                <Translate value="dashboard.welcome.authenticated" />
              </span>
            )}
          </div>
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
      {/* Two-column layout: Widgets left, Welcome right */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 px-4 md:px-0 pt-4">
        {hasLibrary && (
          <div className="md:w-1/2 flex flex-col gap-4 md:gap-6 order-2 md:order-1">
            <ContinueListeningCard />
            <StatsCard />
            <TopThisWeekCard />
          </div>
        )}
        <div className="md:w-1/2 order-1 md:order-2">
          <WelcomeCard />
        </div>
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
