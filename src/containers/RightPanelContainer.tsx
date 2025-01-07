import Sidebar from 'react-sidebar'
import { connect } from 'react-redux'
import { State as RootState } from '../reducers'
import Social from '../pages/Social'
import { Dispatch } from 'redux'
import * as types from '../constants/ActionTypes'

const SidebarContents = ({ dispatch }: { dispatch: Dispatch }) => {
  return <div className='w-full h-full'>
    <Social dispatch={dispatch} />
  </div>
}

const RightPanelContainer = ({ rightPanelToggled, dispatch }: { rightPanelToggled: boolean, dispatch: Dispatch }) => {
  const handleSetSidebarOpen = (open: boolean) => {
    dispatch({ type: types.TOGGLE_RIGHT_PANEL, value: open })
  }

  return (
    <Sidebar
      sidebar={<SidebarContents dispatch={dispatch} />}
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

const mapStateToProps = (state: RootState) => ({
  rightPanelToggled: state.app.rightPanelToggled
})

export default connect(mapStateToProps)(RightPanelContainer)
