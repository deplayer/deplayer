import { useDispatch, useSelector } from 'react-redux'

import * as types from '../../constants/ActionTypes'
import SidebarContents from './SidebarContents'
import Sidebar from 'react-sidebar'
import { State } from '../../reducers'

type Props = {
  children: React.ReactNode
}

function MSidebar({ children }: Props) {
  const dispatch = useDispatch()
  const sidebarToggled = useSelector((state: State) => state.app.sidebarToggled)
  const mqlMatch = useSelector((state: State) => state.app.mqlMatch)
  const app = useSelector((state: State) => state.app)
  const player = useSelector((state: State) => state.player)
  
  const docked = mqlMatch && sidebarToggled

  const onSetSidebarOpen = (open: boolean) => {
    if (!docked) {
      dispatch({ type: types.TOGGLE_SIDEBAR, value: open })
    }
  }

  const contents = (
    <SidebarContents
      app={app}
      onSetSidebarOpen={onSetSidebarOpen}
      dispatch={dispatch}
      className={(player.playing && player.streamUri) ? 'pb-20' : ''}
    />
  )

  return (
    <Sidebar
      sidebar={contents}
      open={sidebarToggled}
      sidebarId='left-sidebar'
      sidebarClassName='w-64 z-50 bg-base-200/70 backdrop-blur'
      overlayClassName='z-50'
      overlayId='left-sidebar-overlay'
      contentId='left-sidebar-content'
      styles={{ overlay: { zIndex: '50' } }}
      onSetOpen={onSetSidebarOpen}
      transitions={true}
      docked={docked}
    >
      {children}
    </Sidebar>
  )
}

export default MSidebar
