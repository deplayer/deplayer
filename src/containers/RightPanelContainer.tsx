import Sidebar from 'react-sidebar'
import { useDispatch, useSelector } from 'react-redux'
import { State as RootState } from '../reducers'
import Social from '../pages/Social'
import * as types from '../constants/ActionTypes'

const SidebarContents = () => {
  return <div className='w-full h-full'>
    <Social />
  </div>
}

const RightPanelContainer = () => {
  const dispatch = useDispatch()
  const rightPanelToggled = useSelector((state: RootState) => state.app.rightPanelToggled)

  const handleSetSidebarOpen = (open: boolean) => {
    dispatch({ type: types.TOGGLE_RIGHT_PANEL, value: open })
  }

  return (
    <Sidebar
      sidebar={<SidebarContents />}
      open={rightPanelToggled}
      pullRight={true}
      onSetOpen={handleSetSidebarOpen}
      sidebarId='right-sidebar'
      sidebarClassName='w-64 bg-base-200/70 backdrop-blur fixed'
      overlayId='right-sidebar-overlay'
      overlayClassName='fixed inset-0'
      contentId='right-sidebar-content'
      styles={{
        overlay: { backgroundColor: 'rgba(0, 0, 0, 0.3)', zIndex: '40' },
        sidebar: { position: 'fixed', zIndex: '50' },
        content: { position: 'relative' }
      }}
    >
      <div id='right-sidebar-content' />
    </Sidebar>
  )
}

export default RightPanelContainer
