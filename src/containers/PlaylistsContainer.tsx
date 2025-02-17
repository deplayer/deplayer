import { connect } from 'react-redux'
import Playlists from '../components/Playlists'
import { State } from '../reducers'

export default connect(
  (state: State) => ({
    playlist: state.playlist,
    collection: state.collection,
    settings: state.settings,
    queue: state.queue
  })
)(Playlists) 