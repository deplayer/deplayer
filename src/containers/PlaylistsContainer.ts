import { connect } from 'react-redux'
import Playlists from '../components/Playlists'
import { State } from '../reducers'

export default connect(
  (state: State) => ({
    app: state.app,
    queue: state.queue,
    playlist: state.playlist,
    player: state.player,
    collection: state.collection
  })
)(Playlists)
