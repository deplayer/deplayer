import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import Topbar from '../components/Topbar/Topbar'

export default withRouter(connect((state, ownProps) => {
  const hasResults = state.queue.trackIds && state.queue.trackIds.length ? true : false
  const inHome = ownProps.location.pathname === '/' ? true : false
  return {
    hasResults,
    loading: state.search.loading,
    mqlMatch: state.app.mqlMatch,
    showInCenter: !hasResults && inHome,
    error: state.search.error,
    searchTerm: state.search.searchTerm,
    searchToggled: state.search.searchToggled
  }
})(Topbar))
