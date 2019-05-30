import { connect } from 'react-redux'
import Collection from '../components/Collection'

export default connect(
  (state) => ({
    app: state.app,
    queue: state.queue,
    player: state.player,
    collection: state.collection,
    visibleSongs: state.collection.visibleSongs
  })
)(Collection)
