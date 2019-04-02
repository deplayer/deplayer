import { connect } from 'react-redux'
import ArtistsTable from '../components/ArtistsTable/ArtistTable'

export default connect(
  (state) => ({
    queue: state.queue,
    player: state.player,
    collection: state.collection,
    tableIds: Object.keys(state.collection.artists),
    visibleSongs: state.collection.visibleSongs
  })
)(ArtistsTable)
