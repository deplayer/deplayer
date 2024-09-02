import { Translate } from 'react-redux-i18n'
import { FunctionComponent, SVGProps } from 'react'
import { Link } from 'react-router-dom'
import React from 'react'

import MediaSlider from '../MediaSlider'
import RelatedAlbums from '../RelatedAlbums'
import { State as CollectionState } from '../../reducers/collection'
import * as types from '../../constants/ActionTypes'

import RecordPlayerSvg from './record-player.svg?react'
import CasseteSvg from './cassete.svg?react'
import WalkmanSvg from './walkman.svg?react'
import DiscmanSvg from './discman.svg?react'
import HeadsetSvg from './headset.svg?react'
import PhonophoneSvg from './phonophone.svg?react'
import Auth from '../Auth'
import Button from '../common/Button'

type Props = {
  collection: CollectionState
  dispatch: Function
}

const IMAGE_COMPONENTS: FunctionComponent<SVGProps<SVGSVGElement>>[] = [
  RecordPlayerSvg,
  CasseteSvg,
  WalkmanSvg,
  DiscmanSvg,
  HeadsetSvg,
  PhonophoneSvg
]

const pickImage = () => IMAGE_COMPONENTS[Math.floor(Math.random() * IMAGE_COMPONENTS.length)]

function DeplayerTitle(): JSX.Element {
  return (
    <>
      <span className='text-blue-500'>d</span>
      <span className='text-blue-900 '>eplayer</span>
    </>
  )
}

const Image = () => {
  const ImageComponent = pickImage()

  return (
    <ImageComponent
      className='w-60 cursor-pointer fill-sky-700 dark:fill-sky-500 h-auto'
    />
  )
}

const WelcomeMessage = ({ dispatch }: { dispatch: Function }) => {
  const [showAuthModal, setShowAuthModal] = React.useState(false)
  const credentials = localStorage.getItem('credentials')

  return (
    <div className='flex flex-col md:flex-row w-full content-start items-center'>
      { showAuthModal && <Auth dispatch={dispatch} onClose={() => setShowAuthModal(false)} /> }
      <h4 className="text-xl text-center py-4 text-sky-900 dark:text-sky-300 p-4">
        Hi <i>audiophile</i>! Welcome to <DeplayerTitle />
      </h4>
      <Image />
      <div className='px-6 py-8'>
        <p className='py-4'>
          Access to you good ol' music library and enjoy it whenever you need it. <br />
          To start playing some content follow one of the steps below:
        </p>
        <ul>
          <li><Link to='/providers' className='text-blue-500'>Setup your media providers</Link>, (Subsonic API, mstream or ITunes)</li>
          <li>
            <a onClick={() => dispatch({ type: types.SHOW_ADD_MEDIA_MODAL })} className='text-blue-500 cursor-pointer'>Add new media to your collection</a> Webtorrent, Filesystem, IPFS or youtube-dl-server
          </li>
          <li><Link to='/collection' className='text-blue-500'>Or go to your collection</Link></li>
        </ul>
        <div className='pt-6 flex flex-col items-center md:justify-start'>
          { credentials && <p className='py-2'>You are authenticated with your passkey</p> }
          { !credentials && (
              <>
                <p className='py-2'>Access social capabilities by authenticating with your passkey</p>
                <Button long onClick={setShowAuthModal}>🔒 Auth</Button>
              </>
            )
          }
        </div>
      </div>
    </div>
  )
}


const Dashboard = ({
  collection: { loading, rows, songsByNumberOfPlays, albums },
  dispatch
}: Props) => {
  const MAX_LIST_ITEMS = 25

  const mediaItems = songsByNumberOfPlays.map((songId: string) => {
    return rows[songId]
  })

  const slicedAlbums = Object
    .keys(albums)
    .slice(0, MAX_LIST_ITEMS)
    .map((albumId) => albums[albumId])

  return (
    <div className='z-10 w-full block px-12 mb-12'>
      <WelcomeMessage dispatch={dispatch}></WelcomeMessage>
      {!!mediaItems.length &&
        <MediaSlider
          loading={loading}
          title={<Translate value='titles.mostPlayedSongs' />}
          mediaItems={mediaItems.slice(0, MAX_LIST_ITEMS)}
        />}
      {!!slicedAlbums.length && <RelatedAlbums albums={slicedAlbums} />}
    </div>
  )
}

export default Dashboard
