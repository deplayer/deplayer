import Sidebar from 'react-sidebar'
import { connect } from 'react-redux'
import { State as RootState } from '../reducers'
import Social from '../pages/Social'
import { Dispatch } from 'redux'
import * as types from '../constants/ActionTypes'

const SidebarContents = () => {
  return <div className='w-full h-full' style={{ zIndex: '10' }}>
    <Social />
  </div>
}

const RightPanelContainer = ({ rightPanelToggled, dispatch }: { rightPanelToggled: boolean, dispatch: Dispatch }) => {
  const handleSetSidebarOpen = (open: boolean) => {
    dispatch({ type: types.TOGGLE_RIGHT_PANEL, value: open })
  }

  return (
    <Sidebar
      sidebar={<SidebarContents />}
      open={rightPanelToggled}
      pullRight={true}
      onSetOpen={(open) => handleSetSidebarOpen(open)}
      sidebarId='right-sidebar'
      sidebarClassName='w-64 z-50 bg-gray-200 dark:bg-black z-50'
      overlayId='right-sidebar-overlay'
      contentId='right-sidebar-content'
      styles={{ overlay: { zIndex: '10' }, sidebar: { zIndex: '20' } }}
    >
      <div id='right-sidebar-content' />
    </Sidebar>
  )
}

const mapStateToProps = (state: RootState) => ({
  rightPanelToggled: state.app.rightPanelToggled
})

export default connect(mapStateToProps)(RightPanelContainer)
