import { connect } from 'react-redux'
import Collection from '../components/Collection'
import { State } from '../reducers'

export default connect(
  (state: State) => ({
    collection: state.collection,
    settings: state.settings,
    app: state.app,
    queue: state.queue,
    player: state.player,
    playlist: state.playlist,
    filteredSongs: state.collection.searchResults
  })
)(Collection) 