import { connect } from 'react-redux'
import PlaylistsView from '../components/Playlists/PlaylistsView'
import { State } from '../reducers'

export default connect(
  (state: State) => ({
    collection: state.collection,
    settings: state.settings,
    app: state.app,
    queue: state.queue,
    playlist: state.playlist
  })
)(PlaylistsView) 