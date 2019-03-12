import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import Sidebar from '../components/Sidebar/Sidebar'

export default withRouter(connect((state, ownProps) => {
  const hasResults = state.queue.trackIds && state.queue.trackIds.length ? true : false
  const inHome = ownProps.location.pathname === '/' ? true : false
  return {
    hasResults,
    loading: state.search.loading,
    showInCenter: !hasResults && inHome,
    error: state.search.error,
    searchTerm: state.search.searchTerm,
    searchToggled: state.search.searchToggled
  }
})(Sidebar))
