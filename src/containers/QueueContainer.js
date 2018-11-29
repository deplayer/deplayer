import { connect } from 'react-redux'
import Playlist from '../components/Playlist'

export default connect(
  (state) => ({
    queue: state.queue,
    playlist: state.playlist,
    player: state.player,
    collection: state.collection
  })
)(Playlist)
