import { connect } from 'react-redux'

import Sidebar from '../components/Sidebar/Sidebar'

export default connect((state: any, ownProps: any) => {
  return {
    mqlMatch: state.app.mqlMatch,
    loading: state.search.loading,
    collection: state.collection,
    app: state.app,
    queue: state.queue,
    sidebarToggled: state.app.sidebarToggled
  }
})(Sidebar)
