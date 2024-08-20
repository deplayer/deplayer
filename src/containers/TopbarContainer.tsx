import { connect } from 'react-redux'
import { useLocation, Location } from 'react-router-dom'

import Icon from '../components/common/Icon'
import Topbar from '../components/Topbar/Topbar'

type TitleCollection = {
  rows: any
  artists: any
  albums: any
}

const dynamicTitle = (
  location: Location,
  collection: TitleCollection,
  searchTerm: string = ''
): string | React.ReactNode => {
  const songFinder = location.pathname.match(/\/song\/(.*)/)
  const artistFinder = location.pathname.match(/\/artist\/(.*)/)
  const albumFinder = location.pathname.match(/\/album\/(.*)/)

  if (songFinder && songFinder[1]) {
    const song = collection.rows[songFinder[1]]

    if (!song) {
      return 'Song'
    }

    const title = song.title + ' - ' + song.artist.name

    return <><Icon icon='faMusic' /> {title}</>
  }

  if (artistFinder && artistFinder[1]) {
    // return 'Artist'
    const artist = collection.artists[artistFinder[1]]

    if (!artist) {
      return 'Artist'
    }

    return <><Icon icon='faMicrophoneAlt' /> {artist.name}</>
  }

  if (albumFinder && albumFinder[1]) {
    // return 'Artist'
    const album = collection.albums[albumFinder[1]]

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


export default connect((state: any) => {
  const location = useLocation()
  const title = dynamicTitle(location, state.collection, state.search.searchTerm)
  const hasResults = state.queue.trackIds && state.queue.trackIds.length ? true : false
  const inHome = location.pathname === '/' ? true : false
  return {
    title: title,
    hasResults,
    loading: state.search.loading,
    mqlMatch: state.app.mqlMatch,
    showInCenter: !hasResults && inHome,
    error: state.search.error,
    searchTerm: state.search.searchTerm,
    searchToggled: state.search.searchToggled
  }
})(Topbar)
