import { connect } from 'react-redux'
import SongView from '../components/SongView'
import { useLocation, Location } from 'react-router'
import { useMemo } from 'react'
import type { Dispatch } from 'redux'
import {
  useMediaById,
  useAlbumsByArtist,
  useMediaByGenre
} from '../stores/livestore/hooks'
import type { MediaRow, AlbumRow } from '../types/media'
import type { State as PlayerState } from '../reducers/player'
import type { State as CollectionState } from '../reducers/collection'
import * as portals from 'react-reverse-portal'

interface RootState {
  player: PlayerState;
}

interface RoutedSongViewProps {
  player: PlayerState;
  playerPortal: portals.HtmlPortalNode;
  dispatch: Dispatch;
}

const getSongId = (location: Location): string => {
  const songFinder = location.pathname.match(/\/song\/(.*)/)

  if (songFinder && songFinder[1]) {
    return songFinder[1]
  }

  return '0'
}

const RoutedSongView = (props: RoutedSongViewProps) => {
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
    const rows: Record<string, MediaRow> = {}
    const albums: Record<string, AlbumRow> = {}
    const albumsByArtistMap: Record<string, string[]> = {}
    const songsByGenre: Record<string, string[]> = {}

    // Add the current song
    if (song) {
      rows[song.id] = song
    }

    // Add genre songs for recommendations
    if (firstGenre && genreSongs) {
      songsByGenre[firstGenre] = genreSongs.map((s: Record<string, unknown>) => s.id as string)
      genreSongs.forEach((s: Record<string, unknown>) => {
        rows[s.id as string] = s as unknown as MediaRow
      })
    }

    // Add artist's albums
    if (artistId && albumsByArtist) {
      albumsByArtistMap[artistId] = (albumsByArtist as unknown as Array<{ id: string }>).map((a) => a.id)
      ;(albumsByArtist as unknown as Array<{ id: string }>).forEach((a) => {
        albums[a.id] = a as unknown as AlbumRow
      })
    }

    return {
      rows,
      albums,
      albumsByArtist: albumsByArtistMap,
      songsByGenre,
    }
  }, [song, artistId, albumsByArtist, firstGenre, genreSongs])

  return (<SongView songId={songId} collection={collection as unknown as CollectionState} loading={false} location={window.location} {...props} />)
}

export default connect(
  (state: RootState) => {
    return {
      player: state.player,
    }
  }
)(RoutedSongView)
