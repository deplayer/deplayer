import { connect } from 'react-redux'
import ArtistTable from '../components/ArtistsTable/ArtistTable'
import { State } from '../reducers'

export default connect(
  (state: State) => ({
    collection: state.collection,
    settings: state.settings,
    app: state.app,
    queue: state.queue
  })
)(ArtistTable) 