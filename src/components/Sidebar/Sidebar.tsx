import { Dispatch } from 'redux'

import * as types from '../../constants/ActionTypes'
import SidebarContents from './SidebarContents'
import Sidebar from 'react-sidebar'
import { State as CollectionState } from '../../reducers/collection'
import { State as QueueState } from '../../reducers/queue'
import { State as AppState } from '../../reducers/app'
import { State as PlaylistState } from '../../reducers/playlist'

type Props = {
  sidebarToggled: boolean,
  mqlMatch: boolean,
  collection: CollectionState,
  queue: QueueState,
  app: AppState,
  playlist: PlaylistState,
  children: React.ReactNode,
  dispatch: Dispatch
}

function MSidebar({
  app,
  collection,
  queue,
  playlist,
  sidebarToggled,
  mqlMatch,
  children,
  dispatch
}: Props) {
  const docked = mqlMatch && sidebarToggled

  const onSetSidebarOpen = (open: boolean) => {
    if (!docked) {
      dispatch({ type: types.TOGGLE_SIDEBAR, value: open })
    }
  }

  const contents = (
    <SidebarContents
      app={app}
      collection={collection}
      queue={queue}
      playlist={playlist}
      onSetSidebarOpen={onSetSidebarOpen}
      dispatch={dispatch}
    />
  )

  return (
    <Sidebar
      sidebar={contents}
      open={sidebarToggled}
      sidebarId='left-sidebar'
      sidebarClassName='w-64 z-50'
      overlayClassName='z-50'
      overlayId='left-sidebar-overlay'
      contentId='left-sidebar-content'
      styles={{ overlay: { zIndex: '50' }, sidebar: { backgroundColor: 'rgba(0, 0, 0, 0.8)' } }}
      onSetOpen={onSetSidebarOpen}
      transitions={true}
      docked={docked}
    >
      {children}
    </Sidebar>
  )
}

export default MSidebar
