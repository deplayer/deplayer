import { connect } from 'react-redux'
import Queue from '../components/Queue'

export default connect(
  (state) => ({
    app: state.app,
    queue: state.queue,
    playlist: state.playlist,
    player: state.player,
    collection: state.collection
  })
)(Queue)
