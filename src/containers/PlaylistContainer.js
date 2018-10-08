import { connect } from 'react-redux'
import Playlist from '../components/Playlist'

export default connect(
  (state) => ({
    ...state.table,
    playlist: state.playlist
  })
)(Playlist)
