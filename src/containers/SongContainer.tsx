import { connect } from 'react-redux'
import SongView from '../components/SongView'
import { useLocation, Location } from 'react-router'
import { useMediaMap, useAlbumsMap, useAlbumIdsByArtist, useSongsByGenre } from '../stores/livestore/hooks'

const getSongId = (location: Location): string => {
  const songFinder = location.pathname.match(/\/song\/(.*)/)

  if (songFinder && songFinder[1]) {
    return songFinder[1]
  }

  console.log('No song id found in location', location)

  return '0'
}

const RoutedSongView = (props: any) => {
  const location = useLocation()
  const songId = getSongId(location)
  
  // Get data from LiveStore
  const mediaMap = useMediaMap()
  const albumsMap = useAlbumsMap()
  const albumIdsByArtist = useAlbumIdsByArtist()
  const songsByGenre = useSongsByGenre()
  
  // Create collection object compatible with SongView
  const collection = {
    rows: mediaMap,
    albums: albumsMap,
    albumsByArtist: albumIdsByArtist,
    songsByGenre: songsByGenre,
  }

  return (<SongView songId={songId} collection={collection} loading={false} {...props} />)
}

export default connect(
  (state: any) => {
    return {
      player: state.player,
    }
  }
)(RoutedSongView)
