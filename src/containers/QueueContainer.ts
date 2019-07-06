import { connect } from 'react-redux'
import Queue from '../components/Queue'

export default connect(
  (state) => ({
    app: state.app,
    queue: state.queue,
    backgroundImage: state.app.backgroundImage,
    playlist: state.playlist,
    player: state.player,
    collection: state.collection
  })
)(Queue)
