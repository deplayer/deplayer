import { connect } from 'react-redux'
import Collection from '../components/Collection'

export default connect(
  (state) => ({
    playlist: state.playlist,
    player: state.player,
    collection: state.collection
  })
)(Collection)
