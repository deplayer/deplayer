import React, { useState } from 'react'
import { Dispatch } from 'redux'
import SearchInput from './SearchInput'
import Icon from '../common/Icon'
import { startSearch, StartSearchAction } from '../../types/search'
import { useUIStore } from '../../stores/uiStore'

type Props = {
  title: React.ReactNode,
  loading: boolean,
  showInCenter: boolean,
  searchTerm: string,
  searchToggled: boolean,
  dispatch: Dispatch<StartSearchAction | { type: string; [key: string]: unknown }>,
  onSetSidebarOpen?: (open: boolean) => void,
  children?: React.ReactNode
}

const Topbar = (props: Props) => {
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const setSearchTerm = useUIStore(s => s.setSearchTerm)
  const toggleSearch = useUIStore(s => s.toggleSearch)
  const toggleSearchOff = useUIStore(s => s.toggleSearchOff)
  const toggleRightPanel = useUIStore(s => s.toggleRightPanel)
  const sidebarToggled = useUIStore(s => s.sidebarToggled)

  const handleSearchChange = (event: React.FormEvent<HTMLInputElement>) => {
    const searchTerm = event.currentTarget.value

    // Update uiStore with search term
    setSearchTerm(searchTerm)

    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Only set a new timeout if the search term is long enough
    if (searchTerm.length > 2) {
      const timeout = setTimeout(() => {
        // Keep Redux saga for provider search (external API calls)
        // LiveStore hook handles local search automatically
        props.dispatch(startSearch(searchTerm))
      }, 800) // Wait 800ms after last keystroke before searching

      setSearchTimeout(timeout)
    } else if (searchTerm.length === 0) {
      // Clear search when empty
      // LiveStore hook will return empty results automatically
    }
  }

  const handleSearchBlur = () => {
    toggleSearch()
  }

  const handleSearchOff = () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    toggleSearchOff()
  }

  const handleToggleSidebar = () => {
    props.onSetSidebarOpen?.(!sidebarToggled)
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
      </div>

      <div className='flex-1 ml-4' style={{ marginRight: '70px' }}>
        <SearchInput
          loading={props.loading}
          value={props.searchTerm}
          searchToggled={props.searchToggled}
          onSearchChange={handleSearchChange}
          onBlur={handleSearchBlur}
          setSearchOff={handleSearchOff}
        />
        {!props.searchToggled && props.title && (
          <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSearch() }} onClick={toggleSearch} className="text-center">{props.title}</div>
        )}
      </div>

      <div className='flex items-center absolute right-5'>
        {props.children}
        <button
          onClick={() => toggleRightPanel()}
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
