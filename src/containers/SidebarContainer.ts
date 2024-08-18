import { connect } from 'react-redux'

import Sidebar from '../components/Sidebar/Sidebar'
import { State } from '../reducers'

export default connect((state: State) => {
  return {
    mqlMatch: state.app.mqlMatch,
    loading: state.search.loading,
    collection: state.collection,
    playlist: state.playlist,
    app: state.app,
    queue: state.queue,
    sidebarToggled: state.app.sidebarToggled
  }
})(Sidebar)
