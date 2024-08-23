import { connect } from 'react-redux'
import * as React from 'react'
import { Dispatch } from 'redux'
import SidebarContainer from './SidebarContainer'
import TopbarContainer from './TopbarContainer'
import SearchButton from '../components/Buttons/SearchButton'
import Placeholder from '../components/Player/Placeholder'
import ReloadPrompt from '../components/ReloadPrompt'
import type { State as AppState } from '../reducers/app'
import type { State } from '../reducers'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'


interface LayoutProps {
  backgroundImage: string,
  dispatch: Dispatch,
  app: AppState,
  children: React.ReactNode
}

function Layout(props: LayoutProps) {
  const background = props.backgroundImage && (
    <>
      <div className='bg-handler before:bg-gray-100/70 dark:before:bg-black/70'></div>
      <div
        className='absolute w-full h-full bg-cover bg-center bg-no-repeat bg-fixed'
        style={{ backgroundImage: `url(${props.backgroundImage})`, filter: 'blur(10px)' }}
      />
    </>
  )

  return (
    <>
      {background}
      <ToastContainer theme='dark' />
      <SidebarContainer>
        <ReloadPrompt />
        <TopbarContainer>
          <SearchButton />
        </TopbarContainer>

        <div
          className='layout-contents'
        >
          {props.children}
        </div>
        <Placeholder mqlMatch={props.app.mqlMatch} />
      </SidebarContainer>
    </>
  )
}

const connector = connect(
  (state: State) => {
    return {
      backgroundImage: state.app.backgroundImage,
      queue: state.queue,
      app: state.app,
      player: state.player,
      collection: state.collection,
      tableIds: Object.keys(state.collection.artists),
      visibleSongs: state.collection.visibleSongs
    }
  }
)

export default connector(Layout)
