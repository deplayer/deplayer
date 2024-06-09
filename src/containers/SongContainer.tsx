import { connect } from 'react-redux'
import SongView from '../components/SongView'
import { useLocation, Location } from 'react-router'

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


  return (<SongView songId={songId} {...props} />)
}

export default connect(
  (state: any) => {
    return {
      collection: state.collection,
      settings: state.settings,
      queue: state.queue,
      lyrics: state.lyrics,
      player: state.player,
      loading: state.collection.loading,
    }
  }
)(RoutedSongView)
