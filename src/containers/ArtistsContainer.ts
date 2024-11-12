import { connect } from 'react-redux'
import ArtistsTable from '../components/ArtistsTable/ArtistTable'

export default connect(
  (state: any) => ({
    queue: state.queue,
    player: state.player,
    collection: state.collection,
    filteredSongs: state.collection.filteredSongs
  })
)(ArtistsTable)
