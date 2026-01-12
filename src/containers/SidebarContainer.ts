import { connect } from 'react-redux'

import Sidebar from '../components/Sidebar/Sidebar'
import { State } from '../reducers'

export default connect((state: State) => {
  return {
    mqlMatch: state.app.mqlMatch,
    loading: state.search.loading,
    collection: state.collection, // Still needed for searchResults (Search domain not migrated)
    app: state.app,
    player: state.player,
    sidebarToggled: state.app.sidebarToggled
  }
})(Sidebar)
