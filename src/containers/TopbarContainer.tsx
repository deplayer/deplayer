import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { State as RootState } from '../reducers'
import Icon from '../components/common/Icon'
import Topbar from '../components/Topbar/Topbar'
import { useUIStore } from '../stores/uiStore'
import { useQueue, useMediaById, useArtistById, useAlbumById } from '../stores/livestore/hooks'

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

// Component that renders dynamic title for detail pages
// OPTIMIZED: Uses targeted single-item queries instead of loading all maps
const DynamicDetailTitle = ({ type, id }: { type: 'song' | 'artist' | 'album', id: string }) => {
  // Only query the specific item we need
  const song = useMediaById(type === 'song' ? id : undefined)
  const artist = useArtistById(type === 'artist' ? id : undefined)
  const album = useAlbumById(type === 'album' ? id : undefined)
  
  if (type === 'song') {
    if (!song) return <>Song</>
    return <><Icon icon='faMusic' /> {song.title} - {song.artist?.name}</>
  }
  
  if (type === 'artist') {
    if (!artist) return <>Artist</>
    return <><Icon icon='faMicrophoneAlt' /> {artist.name}</>
  }
  
  if (type === 'album') {
    if (!album) return <>Album</>
    return <><Icon icon='faMusic' className='mr-4' />{album.name}</>
  }
  
  return null
}

const staticTitle = (pathname: string, searchTerm: string = ''): React.ReactNode => {
  switch (pathname) {
    case '/settings':
      return (
        <>
          <Icon icon='faCogs' className='mr-4' />
          Settings
        </>
      )
    case '/search-results':
      return `Search results for ${searchTerm}`
    case '/collection':
      return (
        <>
          <Icon icon='faDatabase' className='mr-4' />
          Collection
        </>
      )
    case '/collection/video':
      return (
        <>
          <Icon icon='faFilm' className='mr-4' />
          Videos
        </>
      )
    case '/collection/audio':
      return (
        <>
          <Icon icon='faFileAudio' className='mr-4' />
          Audio
        </>
      )
    case '/artists':
      return (
        <>
          <Icon icon='faMicrophoneAlt' className='mr-4' />
          Artists
        </>
      )
    case '/queue':
      return (
        <>
          <Icon icon='faMusic' className='mr-4' />
          Current playing
        </>
      )
    case '/playlists':
      return (
        <>
          <Icon icon='faBookmark' className='mr-4' />
          Playlists
        </>
      )
    case '/providers':
      return (
        <>
          <Icon icon='faPlug' className='mr-4' />
          Providers
        </>
      )
    default:
      return (
        <>
          <Icon icon='faGlobe' className='mr-4' />
          Explore
        </>
      )
  }
}

const TopbarContainer = ({ children }: { children?: React.ReactNode }) => {
  const dispatch = useDispatch()
  const location = useLocation()

  // Get queue from LiveStore (lightweight query)
  const liveQueue = useQueue('default')

  const searchTerm = useUIStore((s) => s.searchTerm)
  const searchToggled = useUIStore((s) => s.searchToggled)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const loading = useSelector((state: RootState) => state.search.loading)

  // OPTIMIZED: Check if we're on a detail page that needs dynamic title
  const { type: detailType, id: detailId } = extractIdFromPath(location.pathname)

  // Build title: either static or dynamic detail component
  const title = detailType && detailId
    ? <DynamicDetailTitle type={detailType} id={detailId} />
    : staticTitle(location.pathname, searchTerm)

  // Parse trackIds from LiveStore queue (can be JSON string or array)
  const parseTrackIds = (ids: string | string[] | null | undefined): string[] => {
    if (!ids) return []
    if (Array.isArray(ids)) return ids
    try {
      return JSON.parse(ids)
    } catch {
      return []
    }
  }

  const queueTrackIds = liveQueue?.shuffle
    ? parseTrackIds(liveQueue.randomTrackIds)
    : parseTrackIds(liveQueue?.trackIds)

  const hasResults = queueTrackIds && queueTrackIds.length ? true : false
  const inHome = location.pathname === '/' ? true : false

  return (
    <Topbar
      title={title}
      loading={loading}
      showInCenter={!hasResults && inHome}
      searchTerm={searchTerm}
      searchToggled={searchToggled}
      dispatch={dispatch}
      onSetSidebarOpen={(open: boolean) => toggleSidebar(open)}
    >
      {children}
    </Topbar>
  )
}

export default TopbarContainer
