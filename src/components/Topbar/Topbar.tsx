import React, { useState } from 'react'
import { Dispatch } from 'redux'
import SearchInput from './SearchInput'
import Icon from '../common/Icon'
import ShareRoomModal from '../ShareRoomModal'
import { State as CollectionState } from '../../reducers/collection'
import { State as AppState } from '../../reducers/app'
import * as types from '../../constants/ActionTypes'

type Props = {
  title: React.ReactNode,
  loading: boolean,
  showInCenter: boolean,
  error: string,
  searchTerm: string,
  searchToggled: boolean,
  dispatch: Dispatch,
  onSetSidebarOpen?: (open: boolean) => void,
  collection?: CollectionState,
  app?: AppState & { roomId?: string },
  children?: React.ReactNode
}

const Topbar = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleSearchChange = (event: React.FormEvent<HTMLInputElement>) => {
    props.dispatch({
      type: types.SET_SEARCH_TERM,
      searchTerm: event.currentTarget.value
    })
  }

  const handleSearchBlur = () => {
    props.dispatch({ type: types.TOGGLE_SEARCH })
  }

  const handleSearchOff = () => {
    props.dispatch({ type: types.TOGGLE_SEARCH_OFF })
  }

  const handleToggleSidebar = () => {
    props.onSetSidebarOpen?.(!props.app?.sidebarToggled)
  }

  return (
    <div className='topbar bg-base-200/70 backdrop-blur flex justify-between overflow-hidden z-20 items-center px-2' style={{ gridArea: 'topbar' }}>
      <div className='flex items-center'>
        <button
          onClick={handleToggleSidebar}
          className="btn btn-ghost btn-circle btn-sm"
          title="Toggle menu"
        >
          <Icon icon='faBars' />
        </button>

        <div className='flex items-center'>
          {props.loading && (
            <div className='loading loading-spinner loading-sm mx-2'></div>
          )}
          {props.error && (
            <div className='text-error mx-2'>
              <Icon icon='faExclamationTriangle' />
            </div>
          )}
        </div>
      </div>

      <div className='flex-1 mx-4'>
        {!props.showInCenter && (
          <SearchInput
            loading={props.loading}
            value={props.searchTerm}
            searchToggled={props.searchToggled}
            onSearchChange={handleSearchChange}
            onBlur={handleSearchBlur}
            setSearchOff={handleSearchOff}
          />
        )}
        {props.showInCenter && props.title && (
          <div className="text-center">{props.title}</div>
        )}
      </div>

      <div className='flex items-center'>
        {props.children}
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-ghost btn-circle"
          title="Share room"
        >
          <Icon icon='faShareAlt' />
        </button>
      </div>

      {props.app?.roomId && (
        <ShareRoomModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          roomCode={props.app.roomId}
          dispatch={props.dispatch}
        />
      )}
    </div>
  )
}

export default Topbar
