import { connect } from 'react-redux'
import Collection from '../components/Collection'

export default connect(
  (state) => ({
    queue: state.queue,
    player: state.player,
    collection: state.collection,
    visibleSongs: state.search.visibleSongs
  })
)(Collection)
