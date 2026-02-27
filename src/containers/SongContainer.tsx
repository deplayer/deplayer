import { connect } from 'react-redux'
import SongView from '../components/SongView'
import { useLocation, Location } from 'react-router'
import { useMemo } from 'react'
import { 
  useMediaById, 
  useAlbumsByArtist, 
  useMediaByGenre
} from '../stores/livestore/hooks'

const getSongId = (location: Location): string => {
  const songFinder = location.pathname.match(/\/song\/(.*)/)

  if (songFinder && songFinder[1]) {
    return songFinder[1]
  }

  return '0'
}

const RoutedSongView = (props: any) => {
  const location = useLocation()
  const songId = getSongId(location)
  
  // PERF: Only load the ONE song we need (not entire library)
  const song = useMediaById(songId)
  
  // Get artist's albums (only when we have the song)
  const artistId = song?.artist?.id
  const albumsByArtist = useAlbumsByArtist(artistId)
  
  // Get songs by genre for recommendations (only first genre)
  const firstGenre = song?.genres?.[0]
  const genreSongs = useMediaByGenre(firstGenre)
  
  // Build minimal collection object compatible with SongView
  // Only include the data we actually have
  const collection = useMemo(() => {
    const rows: Record<string, any> = {}
    const albums: Record<string, any> = {}
    const albumsByArtistMap: Record<string, string[]> = {}
    const songsByGenre: Record<string, string[]> = {}
    
    // Add the current song
    if (song) {
      rows[song.id] = song
    }
    
    // Add genre songs for recommendations
    if (firstGenre && genreSongs) {
      songsByGenre[firstGenre] = genreSongs.map((s: any) => s.id)
      genreSongs.forEach((s: any) => {
        rows[s.id] = s
      })
    }
    
    // Add artist's albums
    if (artistId && albumsByArtist) {
      albumsByArtistMap[artistId] = albumsByArtist.map((a: any) => a.id)
      albumsByArtist.forEach((a: any) => {
        albums[a.id] = a
      })
    }
    
    return {
      rows,
      albums,
      albumsByArtist: albumsByArtistMap,
      songsByGenre,
    }
  }, [song, artistId, albumsByArtist, firstGenre, genreSongs])

  return (<SongView songId={songId} collection={collection} loading={false} {...props} />)
}

export default connect(
  (state: any) => {
    return {
      player: state.player,
    }
  }
)(RoutedSongView)
