import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import Sidebar from '../components/Sidebar/Sidebar'

export default withRouter(connect((state, ownProps) => {
  return {
    sidebarToggled: state.app.sidebarToggled
  }
})(Sidebar))
