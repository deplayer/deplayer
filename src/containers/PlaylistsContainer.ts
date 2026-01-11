import { connect } from 'react-redux'
import Playlists from '../components/Playlists'
import { State } from '../reducers'

export default connect(
  (state: State) => ({
    queue: state.queue,
    settings: state.settings
  })
)(Playlists)
