import { connect } from 'react-redux'
import Playlist from '../components/Playlist'

export default connect(
  (state) => ({
    playlist: state.playlist,
    collection: state.collection
  })
)(Playlist)
