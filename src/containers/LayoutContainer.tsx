import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar/Sidebar'
import TopbarContainer from './TopbarContainer'
import SearchButton from '../components/Buttons/SearchButton'
import Placeholder from '../components/Player/Placeholder'
import ReloadPrompt from '../components/ReloadPrompt'
import type { State } from '../reducers'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import RightPanelContainer from './RightPanelContainer'
import ButterchurnVisualizer from '../components/ButterchurnVisualizer'
import PlayerRefService from '../services/PlayerRefService'
import { useUIStore } from '../stores/uiStore'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const dispatch = useDispatch()
  const backgroundImage = useUIStore((s) => s.backgroundImage)
  const mqlMatch = useUIStore((s) => s.mqlMatch)
  const showVisuals = useUIStore((s) => s.showVisuals)
  const fullscreen = useSelector((state: State) => state.player.fullscreen)

  const getInternalPlayer = () => {
    const playerRef = PlayerRefService.getInstance().getPlayerRef()
    if (!playerRef?.current) return null
    const internalPlayer = playerRef.current.getInternalPlayer()
    if (internalPlayer instanceof HTMLAudioElement) return internalPlayer
    return null
  }

  const internalPlayer = getInternalPlayer()

  const background = backgroundImage && (
    <>
      <div className='bg-handler before:bg-base-200/70'></div>
      <div
        className='absolute w-full h-full bg-cover bg-center bg-no-repeat bg-fixed glass'
        style={{ backgroundImage: `url(${backgroundImage})`, filter: 'blur(10px)' }}
      />
    </>
  )

  return (
    <>
      {background}
      <ToastContainer theme='dark' />
      <Sidebar>
        <ReloadPrompt />
        <TopbarContainer>
          <SearchButton />
        </TopbarContainer>
        <div className='layout-contents z-10'>
          {children}
        </div>
        <Placeholder mqlMatch={mqlMatch} />
      </Sidebar>
      {internalPlayer && showVisuals && (
        <ButterchurnVisualizer
          playerRef={internalPlayer}
          fullscreen={fullscreen}
          width={window.innerWidth}
          height={window.innerHeight}
          dispatch={dispatch}
        />
      )}
      <RightPanelContainer />
    </>
  )
}

export default Layout
