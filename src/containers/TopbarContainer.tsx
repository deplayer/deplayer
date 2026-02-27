import { connect } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { Dispatch } from 'redux'

import { State as RootState } from '../reducers'
import Icon from '../components/common/Icon'
import Topbar from '../components/Topbar/Topbar'
import { State as SearchState } from '../reducers/search'
import { State as AppState } from '../reducers/app'
import * as types from '../constants/ActionTypes'
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

interface TopbarWrapperProps {
  search: SearchState,
  app: AppState,
  dispatch: Dispatch,
  children?: React.ReactNode,
  onSetSidebarOpen?: (open: boolean) => void
}

// Create a new wrapper component to handle hooks
const TopbarWrapper = (props: TopbarWrapperProps) => {
  const location = useLocation()
  
  // Get queue from LiveStore (lightweight query)
  const liveQueue = useQueue('default')
  
  // OPTIMIZED: Check if we're on a detail page that needs dynamic title
  const { type: detailType, id: detailId } = extractIdFromPath(location.pathname)
  
  // Build title: either static or dynamic detail component
  const title = detailType && detailId 
    ? <DynamicDetailTitle type={detailType} id={detailId} />
    : staticTitle(location.pathname, props.search.searchTerm)
  
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

  const handleSidebarToggle = (open: boolean) => {
    props.dispatch({ type: types.TOGGLE_SIDEBAR, value: open })
  }

  return (
    <Topbar
      title={title}
      loading={props.search.loading}
      showInCenter={!hasResults && inHome}
      searchTerm={props.search.searchTerm}
      searchToggled={props.search.searchToggled}
      dispatch={props.dispatch}
      onSetSidebarOpen={handleSidebarToggle}
      app={props.app}
    >
      {props.children}
    </Topbar>
  )
}

// Connect the wrapper component instead
export default connect((state: RootState) => ({
  search: state.search,
  app: state.app
}))(TopbarWrapper)
