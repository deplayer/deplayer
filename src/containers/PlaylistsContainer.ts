import { connect } from 'react-redux'
import Playlists from '../components/Playlists/index'

export default connect(
  (state: any) => ({
    app: state.app,
    queue: state.queue,
    playlist: state.playlist,
    player: state.player,
    collection: state.collection
  })
)(Playlists)
