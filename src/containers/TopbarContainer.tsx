import { connect } from 'react-redux'
import { useLocation, Location } from 'react-router-dom'
import { Dispatch } from 'redux'

import { State as RootState } from '../reducers'
import Icon from '../components/common/Icon'
import Topbar from '../components/Topbar/Topbar'
import { State as SearchState } from '../reducers/search'
import { State as AppState } from '../reducers/app'
import * as types from '../constants/ActionTypes'
import { useQueue, useMediaMap, useArtistsMap, useAlbumsMap } from '../stores/livestore/hooks'

const dynamicTitle = (
  location: Location,
  mediaMap: Record<string, any>,
  artistsMap: Record<string, any>,
  albumsMap: Record<string, any>,
  searchTerm: string = ''
): string | React.ReactNode => {
  const songFinder = location.pathname.match(/\/song\/(.*)/)
  const artistFinder = location.pathname.match(/\/artist\/(.*)/)
  const albumFinder = location.pathname.match(/\/album\/(.*)/)

  if (songFinder && songFinder[1]) {
    const song = mediaMap[songFinder[1]]

    if (!song) {
      return 'Song'
    }

    const title = song.title + ' - ' + song.artist.name

    return <><Icon icon='faMusic' /> {title}</>
  }

  if (artistFinder && artistFinder[1]) {
    const artist = artistsMap[artistFinder[1]]

    if (!artist) {
      return 'Artist'
    }

    return <><Icon icon='faMicrophoneAlt' /> {artist.name}</>
  }

  if (albumFinder && albumFinder[1]) {
    const album = albumsMap[albumFinder[1]]

    if (!album) {
      return 'Album'
    }

    return (
      <>
        <Icon icon='faMusic' className='mr-4' />
        {album.name}
      </>
    )
  }

  switch (location.pathname) {
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
  
  // Get data from LiveStore
  const mediaMap = useMediaMap()
  const artistsMap = useArtistsMap()
  const albumsMap = useAlbumsMap()
  const liveQueue = useQueue('default')
  
  const title = dynamicTitle(location, mediaMap, artistsMap, albumsMap, props.search.searchTerm)
  
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
