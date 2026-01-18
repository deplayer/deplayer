import { connect } from 'react-redux'
import * as React from 'react'
import { Dispatch } from 'redux'
import Sidebar from '../components/Sidebar/Sidebar'
import TopbarContainer from './TopbarContainer'
import SearchButton from '../components/Buttons/SearchButton'
import Placeholder from '../components/Player/Placeholder'
import ReloadPrompt from '../components/ReloadPrompt'
import type { State as AppState } from '../reducers/app'
import type { State } from '../reducers'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import RightPanelContainer from './RightPanelContainer'
import ButterchurnVisualizer from '../components/ButterchurnVisualizer'
import PlayerRefService from '../services/PlayerRefService'
import type { State as PlayerState } from '../reducers/player'

interface LayoutProps {
  backgroundImage: string,
  dispatch: Dispatch,
  app: AppState,
  player: PlayerState,
  children: React.ReactNode
}

function Layout(props: LayoutProps) {
  const getInternalPlayer = () => {
    const playerRef = PlayerRefService.getInstance().getPlayerRef()
    if (!playerRef?.current) return null
    const internalPlayer = playerRef.current.getInternalPlayer()
    if (internalPlayer instanceof HTMLAudioElement) {
      return internalPlayer
    }
    return null
  }

  const internalPlayer = getInternalPlayer()

  const background = props.backgroundImage && (
    <>
      <div className='bg-handler before:bg-base-200/70'></div>
      <div
        className='absolute w-full h-full bg-cover bg-center bg-no-repeat bg-fixed glass'
        style={{ backgroundImage: `url(${props.backgroundImage})`, filter: 'blur(10px)' }}
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
          {props.children}
        </div>
        <Placeholder mqlMatch={props.app.mqlMatch} />

        </Sidebar>
        {internalPlayer && props.app.showVisuals && (
          <ButterchurnVisualizer
            playerRef={internalPlayer}
            fullscreen={props.player.fullscreen}
            width={window.innerWidth}
            height={window.innerHeight}
            dispatch={props.dispatch}
          />
        )}
      <RightPanelContainer />
    </>
  )
}

const connector = connect(
  (state: State) => {
    return {
      backgroundImage: state.app.backgroundImage,
      app: state.app,
      player: state.player,
    }
  }
)

export default connector(Layout)
