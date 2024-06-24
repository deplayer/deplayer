import { connect } from 'react-redux'
import ArtistsTable from '../components/ArtistsTable/ArtistTable'

export default connect(
  (state: any) => ({
    queue: state.queue,
    player: state.player,
    collection: state.collection,
    visibleSongs: state.collection.visibleSongs
  })
)(ArtistsTable)
