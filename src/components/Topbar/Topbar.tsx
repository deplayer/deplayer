import React, { useState } from 'react'
import { Dispatch } from 'redux'
import SearchInput from './SearchInput'
import Icon from '../common/Icon'
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
  app?: AppState,
  children?: React.ReactNode
}

const Topbar = (props: Props) => {
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleSearchChange = (event: React.FormEvent<HTMLInputElement>) => {
    const searchTerm = event.currentTarget.value
    props.dispatch({
      type: types.SET_SEARCH_TERM,
      searchTerm
    })

    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Only set a new timeout if the search term is long enough
    if (searchTerm.length > 2) {
      const timeout = setTimeout(() => {
        props.dispatch({
          type: types.START_SEARCH,
          searchTerm
        })
      }, 500) // Wait 500ms after last keystroke before searching

      setSearchTimeout(timeout)
    }
  }

  const handleSearchBlur = () => {
    props.dispatch({ type: types.TOGGLE_SEARCH })
  }

  const handleSearchOff = () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    props.dispatch({ type: types.TOGGLE_SEARCH_OFF })
  }

  const handleToggleSidebar = () => {
    props.onSetSidebarOpen?.(!props.app?.sidebarToggled)
  }

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

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
          onClick={() => props.dispatch({ type: types.TOGGLE_RIGHT_PANEL })}
          className="btn btn-ghost btn-circle"
          title="Share room"
        >
          <Icon icon='faShareAlt' />
        </button>
      </div>
    </div>
  )
}

export default Topbar
