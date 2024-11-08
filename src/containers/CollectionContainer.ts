import { connect } from 'react-redux'
import Collection from '../components/Collection'
import { State } from '../reducers'

export default connect(
  (state: State, ownProps: any) => ({
    app: state.app,
    queue: state.queue,
    player: state.player,
    collection: state.collection,
    location: ownProps.location,
    backgroundImage: state.app.backgroundImage,
    visibleSongs: Object.keys(state.collection.rows)
  })
)(Collection)
