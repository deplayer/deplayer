import { connect } from 'react-redux'
import * as React from 'react'
import { Dispatch } from 'redux'
import SidebarContainer from './SidebarContainer'
import TopbarContainer from './TopbarContainer'
import SearchButton from '../components/Buttons/SearchButton'
import Placeholder from '../components/Player/Placeholder'
import Icon from '../components/common/Icon'
import type { State as AppState } from '../reducers/app'
import type { State } from '../reducers'
import { useLocation, Location } from 'react-router-dom'

type TitleCollection = {
  rows: any
  artists: any
  albums: any
}

interface LayoutProps {
  backgroundImage: string,
  dispatch: Dispatch,
  app: AppState,
  title: string,
  children: React.ReactNode
}

function Layout(props: LayoutProps) {
  return (
    <>
      {props.backgroundImage && (
        <>
          <div className='bg-handler'></div>
          <div
            className='absolute w-full h-full bg-cover bg-center bg-no-repeat bg-fixed'
            style={{ backgroundImage: `url(${props.backgroundImage})`, filter: 'blur(10px)' }}
          />
        </>
      )
      }
      <SidebarContainer>
        <TopbarContainer title={props.title}>
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
    // const location = useLocation()
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
