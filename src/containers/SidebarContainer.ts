import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import Sidebar from '../components/Sidebar/Sidebar'

export default withRouter(connect((state, ownProps) => {
  return {
    loading: state.search.loading,
    collection: state.collection,
    app: state.app,
    queue: state.queue,
    sidebarToggled: state.app.sidebarToggled
  }
})(Sidebar))
