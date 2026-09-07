import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar/Sidebar'
import Topbar from '../components/Topbar/Topbar'
import SearchButton from '../components/Buttons/SearchButton'
import Placeholder from '../components/Player/Placeholder'
import ReloadPrompt from '../components/ReloadPrompt'
import type { State } from '../reducers'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import RightPanelContainer from './RightPanelContainer'
import ButterchurnVisualizer from '../components/ButterchurnVisualizer'
import VisualizerPanel from '../components/Player/VisualizerPanel'
import { panelContainerStyleFromPosition } from '../components/Player/panelPosition'
import PlayerRefService from '../services/PlayerRefService'
import { useUIStore } from '../stores/uiStore'
import { CSSTransition } from 'react-transition-group'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const dispatch = useDispatch()
  const backgroundImage = useUIStore((s) => s.backgroundImage)
  const mqlMatch = useUIStore((s) => s.mqlMatch)
  const visualsMode = useUIStore((s) => s.visualsMode)
  const setVisualsMode = useUIStore((s) => s.setVisualsMode)
  const panelPositionRight = useUIStore((s) => s.panelPositionRight)
  const panelPositionBottom = useUIStore((s) => s.panelPositionBottom)
  const panelPositionTop = useUIStore((s) => s.panelPositionTop)
  const setPanelPosition = useUIStore((s) => s.setPanelPosition)
  const fullscreen = useSelector((state: State) => state.player.fullscreen)
  // RTG 4.4.5 calls ReactDOM.findDOMNode unless nodeRef is provided; React 19
  // removed findDOMNode, so the ref is mandatory here.
  const panelRef = React.useRef<HTMLDivElement>(null)

  const getInternalPlayer = () => {
    const playerRef = PlayerRefService.getInstance().getPlayerRef()
    if (!playerRef?.current) return null
    const internalPlayer = playerRef.current.getInternalPlayer()
    if (internalPlayer instanceof HTMLAudioElement) return internalPlayer
    return null
  }

  const internalPlayer = getInternalPlayer()

  const panelContainerStyle = panelContainerStyleFromPosition(
    panelPositionRight,
    panelPositionBottom,
    panelPositionTop
  )

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
        <Topbar>
          <SearchButton />
        </Topbar>
        <main className='layout-contents z-10'>
          {children}
        </main>
        <Placeholder mqlMatch={mqlMatch} />
      </Sidebar>
      {internalPlayer && visualsMode === 'ambient' && (
        <ButterchurnVisualizer
          playerRef={internalPlayer}
          fullscreen={fullscreen}
          width={window.innerWidth}
          height={window.innerHeight}
          pixelRatio={0.75}
          dispatch={dispatch}
        />
      )}

      {internalPlayer && visualsMode === 'panel' && (
        <div className='visualizer-panel-container' style={panelContainerStyle}>
          <CSSTransition
            in={true}
            appear={true}
            timeout={{ enter: 300, exit: 200 }}
            classNames='visualizerPanel'
            unmountOnExit
            nodeRef={panelRef}
          >
            <div ref={panelRef} className='w-full h-full'>
              <VisualizerPanel
                playerRef={internalPlayer}
                pixelRatio={0.75}
                onClose={() => setVisualsMode('off')}
                onPositionChange={(right, bottom, top) => setPanelPosition(right, bottom, top)}
              />
            </div>
          </CSSTransition>
        </div>
      )}
      <RightPanelContainer />
    </>
  )
}

export default Layout
