import { connect } from 'react-redux'
import * as React from 'react'
import { Dispatch } from 'redux'
import SidebarContainer from './SidebarContainer'
import TopbarContainer from './TopbarContainer'
import SearchButton from '../components/Buttons/SearchButton'
import Placeholder from '../components/Player/Placeholder'
import Icon from '../components/common/Icon'

const dynamicTitle = (router, collection, searchTerm: ''): string | React.ReactNode => {
  const songFinder = router.location.pathname.match(/\/song\/(.*)/)
  const artistFinder = router.location.pathname.match(/\/artist\/(.*)/)
  const albumFinder = router.location.pathname.match(/\/album\/(.*)/)

  if (songFinder && songFinder[1]) {
    const song = collection.rows[songFinder[1]]

    if (!song) {
      return 'Song'
    }

    return (
      <>
        <i className='icon music outline mr-4'></i>
        { song.title }
      </>
    )
  }

  if (artistFinder && artistFinder[1]) {
    // return 'Artist'
    const artist = collection.artists[artistFinder[1]]

    if (!artist) {
      return 'Artist'
    }

    return artist.name
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
        { album.name }
      </>
    )
  }

  switch (router.location.pathname) {
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

type LayoutProps = {
  backgroundImage: string,
  dispatch: Dispatch,
  app: any,
  title: string,
  children: any
}

const Layout = (props: LayoutProps) => {
  return (
    <>
    {props.backgroundImage &&
      <div
        className='bg-handler absolute w-full h-full bg-cover bg-center bg-no-repeat bg-fixed'
        style={{backgroundImage: `url(${ props.backgroundImage })`, filter: 'blur(10px)'}}
      />
    }
    <SidebarContainer>
      <TopbarContainer title={ props.title }>
        <SearchButton />
      </TopbarContainer>

      <div
        className='contents'
      >
        { props.children }
      </div>
      <Placeholder mqlMatch={props.app.mqlMatch} />
    </SidebarContainer>
    </>
  )
}

export default connect(
  (state: any) => ({
    title: dynamicTitle(state.router, state.collection, state.search.searchTerm),
    backgroundImage: state.app.backgroundImage,
    queue: state.queue,
    app: state.app,
    player: state.player,
    collection: state.collection,
    tableIds: Object.keys(state.collection.artists),
    visibleSongs: state.collection.visibleSongs
  })
)(Layout)
