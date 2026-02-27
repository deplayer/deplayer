import { Translate } from 'react-redux-i18n'
import { FunctionComponent, SVGProps } from 'react'
import { Link } from 'react-router-dom'
import React from 'react'
import { useDispatch } from 'react-redux'

import MediaSlider from '../MediaSlider'
import RelatedAlbums from '../RelatedAlbums'
import RecentAlbums from './RecentAlbums'
import * as types from '../../constants/ActionTypes'
import Footer from '../Footer'
import TryDemoButton from '../Buttons/TryDemoButton'

import RecordPlayerSvg from './record-player.svg?react'
import CasseteSvg from './cassete.svg?react'
import WalkmanSvg from './walkman.svg?react'
import DiscmanSvg from './discman.svg?react'
import HeadsetSvg from './headset.svg?react'
import PhonophoneSvg from './phonophone.svg?react'
import Auth from '../Auth'
import Button from '../common/Button'
import { Dispatch } from 'redux'
import DeplayerTitle from '../DeplayerTitle'
import { useMostPlayed, useRecentAlbums } from '../../stores/livestore/hooks'
import { useUI } from '../../contexts'

const IMAGE_COMPONENTS: FunctionComponent<SVGProps<SVGSVGElement>>[] = [
  RecordPlayerSvg,
  CasseteSvg,
  WalkmanSvg,
  DiscmanSvg,
  HeadsetSvg,
  PhonophoneSvg
]

const pickImage = () => IMAGE_COMPONENTS[Math.floor(Math.random() * IMAGE_COMPONENTS.length)]

const Image = () => {
  const ImageComponent = pickImage()

  return (
    <ImageComponent
      className={`w-60 cursor-pointer fill-base-content h-auto`}
    />
  )
}

const WelcomeMessage = ({ dispatch }: { dispatch: Dispatch }) => {
  const [showAuthModal, setShowAuthModal] = React.useState(false)
  const credentials = localStorage.getItem('credentials')

  return (
    <div className='flex flex-col md:flex-row w-full content-start'>
      {showAuthModal && <Auth />}
      <div className='flex flex-col items-center min-w-1/2'>
        <h4 className="text-xl text-center py-4 p-4">
          <Translate value="dashboard.welcome.title" dangerousHTML /> <DeplayerTitle />
        </h4>
        <Image />
      </div>
      <div className='bg-base-300 mt-4 mx-10 my-10 glass'>
        <div className='bg-base-200 p-4 px-6 md:py-8'>
          <p className='py-4 text-base-content'>
            <Translate value="dashboard.welcome.description" /> <br />
            <Translate value="dashboard.welcome.steps" />
          </p>
          <div className='mb-6 flex justify-center'>
            <TryDemoButton />
          </div>
          <ul>
            <li>
              <Link to='/providers' className='text-primary hover:text-primary-focus'>
                <Translate value="dashboard.welcome.setupProviders" />
              </Link>
            </li>
            <li>
              <a onClick={() => dispatch({ type: types.SHOW_ADD_MEDIA_MODAL })} className='text-primary hover:text-primary-focus cursor-pointer'>
                <Translate value="dashboard.welcome.addMedia" />
              </a>{' '}
              <Translate value="dashboard.welcome.addMediaDescription" />
            </li>
            <li>
              <Link to='/collection' className='text-primary hover:text-primary-focus'>
                <Translate value="dashboard.welcome.goToCollection" />
              </Link>
            </li>
          </ul>
          <div className='pt-6 flex flex-col items-center md:justify-start'>
            {credentials && (
              <p className='py-2 text-base-content'>
                <Translate value="dashboard.welcome.authenticated" />
              </p>
            )}
            {!credentials && (
              <>
                <p className='py-2 text-base-content'>
                  <Translate value="dashboard.welcome.authNeeded" />
                </p>
                <Button long onClick={() => setShowAuthModal(true)}>
                  <Translate value="dashboard.welcome.authButton" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const Dashboard = () => {
  const MAX_LIST_ITEMS = 25
  
  // Get data from LiveStore hooks - OPTIMIZED: targeted queries instead of full library
  // useMostPlayed: Only fetches top N by playCount (vs loading ALL media and sorting in JS)
  // useRecentAlbums: Only fetches recent albums (vs loading ALL albums)
  const mostPlayedSongs = useMostPlayed(MAX_LIST_ITEMS)
  const recentAlbumsData = useRecentAlbums(MAX_LIST_ITEMS)
  const { loading } = useUI()
  
  // Get Redux dispatch for modal actions (not yet migrated)
  const dispatch = useDispatch()

  return (
    <div className='z-10 w-full md:px-12 mb-12 flex flex-col gap-4 md:gap-10'>
      <WelcomeMessage dispatch={dispatch} />
      <RecentAlbums />
      {mostPlayedSongs.length > 0 &&
        <MediaSlider
          loading={loading}
          title={<Translate value='titles.mostPlayedSongs' />}
          mediaItems={mostPlayedSongs}
        />}
      {!!recentAlbumsData?.length && <RelatedAlbums albums={recentAlbumsData as any} />}
      <Footer />
    </div>
  )
}

export default Dashboard
