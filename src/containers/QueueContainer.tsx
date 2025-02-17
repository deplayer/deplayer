import { connect } from 'react-redux'
import Queue from '../components/Queue'
import { State } from '../reducers'

export default connect(
  (state: State) => ({
    queue: state.queue,
    collection: state.collection,
    settings: state.settings,
    app: state.app,
    player: state.player
  })
)(Queue) 