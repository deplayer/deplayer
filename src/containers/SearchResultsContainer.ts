import { connect } from 'react-redux'
import Collection from '../components/Collection'
import { State as RootState } from '../reducers'

export default connect(
  (state: RootState) => ({
    app: state.app,
    queue: state.queue,
    player: state.player,
    collection: state.collection,
    visibleSongs: state.collection.searchResults,
    playlist: state.playlist,
    filteredSongs: state.collection.searchResults
  })
)(Collection)
