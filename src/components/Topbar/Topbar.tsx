import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import type { Dispatch } from 'redux'
import SearchInput from './SearchInput'
import Icon from '../common/Icon'
import { startSearch, StartSearchAction } from '../../types/search'
import { useUIStore } from '../../stores/uiStore'
import { useQueue, useMediaById, useArtistById, useAlbumById } from '../../stores/livestore/hooks'
import type { State as RootState } from '../../reducers'

// Extract ID from route path
const extractIdFromPath = (pathname: string): { type: 'song' | 'artist' | 'album' | null, id: string | null } => {
  const songMatch = pathname.match(/\/song\/(.+)/)
  if (songMatch) return { type: 'song', id: songMatch[1] }

  const artistMatch = pathname.match(/\/artist\/(.+)/)
  if (artistMatch) return { type: 'artist', id: artistMatch[1] }

  const albumMatch = pathname.match(/\/album\/(.+)/)
  if (albumMatch) return { type: 'album', id: albumMatch[1] }

  return { type: null, id: null }
}

// Renders dynamic title for detail pages via targeted single-item queries
const DynamicDetailTitle = ({ type, id }: { type: 'song' | 'artist' | 'album', id: string }) => {
  const song = useMediaById(type === 'song' ? id : undefined)
  const artist = useArtistById(type === 'artist' ? id : undefined)
  const album = useAlbumById(type === 'album' ? id : undefined)

  if (type === 'song') {
    return song ? <>{song.title}</> : null
  }
  if (type === 'artist') {
    return artist ? <>{artist.name}</> : null
  }
  if (type === 'album') {
    return album ? <>{album.name}</> : null
  }
  return null
}

const staticTitle = (pathname: string, searchTerm: string = ''): React.ReactNode => {
  if (searchTerm) return searchTerm
  if (pathname === '/') return ''
  if (pathname === '/search') return 'Search'
  if (pathname.startsWith('/collection')) return 'Collection'
  if (pathname.startsWith('/playlists')) return 'Playlists'
  if (pathname.startsWith('/artists')) return 'Artists'
  if (pathname.startsWith('/settings')) return 'Settings'
  if (pathname.startsWith('/queue')) return 'Queue'
  return ''
}

const parseTrackIds = (ids: string | string[] | null | undefined): string[] => {
  if (!ids) return []
  if (Array.isArray(ids)) return ids
  try { return JSON.parse(ids) } catch { return [] }
}

type Props = {
  children?: React.ReactNode
}

const Topbar = ({ children }: Props) => {
  const dispatch = useDispatch<Dispatch<StartSearchAction>>()
  const location = useLocation()
  const liveQueue = useQueue('default')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const searchTerm = useUIStore((s) => s.searchTerm)
  const searchOpen = useUIStore((s) => s.searchOpen)
  const sidebarToggled = useUIStore((s) => s.sidebarToggled)
  const setSearchTerm = useUIStore((s) => s.setSearchTerm)
  const toggleSearch = useUIStore((s) => s.toggleSearch)
  const closeSearch = useUIStore((s) => s.closeSearch)
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const loading = useSelector((state: RootState) => state.search.loading)

  const { type: detailType, id: detailId } = extractIdFromPath(location.pathname)
  const title = detailType && detailId
    ? <DynamicDetailTitle type={detailType} id={detailId} />
    : staticTitle(location.pathname, searchTerm)

  const queueTrackIds = liveQueue?.shuffle
    ? parseTrackIds(liveQueue.randomTrackIds)
    : parseTrackIds(liveQueue?.trackIds)
  const hasResults = queueTrackIds.length > 0
  const inHome = location.pathname === '/'
  const showInCenter = !hasResults && inHome

  const handleSearchChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    setSearchTerm(value)

    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (value.length > 2) {
      const timeout = setTimeout(() => {
        dispatch(startSearch(value))
      }, 800)
      setSearchTimeout(timeout)
    }
  }

  const handleSearchBlur = () => {
    toggleSearch()
  }

  const handleSearchOff = () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    closeSearch()
  }

  const handleToggleSidebar = () => {
    toggleSidebar(!sidebarToggled)
  }

  React.useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout)
    }
  }, [searchTimeout])

  // showInCenter is computed but not currently consumed by the JSX; preserved
  // for parity with the previous container. If/when the layout grows a
  // hero-style topbar treatment, switch on showInCenter here.
  void showInCenter

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
          loading={loading}
          value={searchTerm}
          searchOpen={searchOpen}
          onSearchChange={handleSearchChange}
          onBlur={handleSearchBlur}
          setSearchOff={handleSearchOff}
        />
        {!searchOpen && title && (
          <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSearch() }} onClick={toggleSearch} className="text-center">{title}</div>
        )}
      </div>

      <div className='flex items-center absolute right-5'>
        {children}
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
