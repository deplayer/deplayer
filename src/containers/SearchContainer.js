import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import SearchBar from '../components/SearchBar/SearchBar'

export default withRouter(connect((state, ownProps) => {
  const hasResults = state.queue.trackIds && state.queue.trackIds.length ? true : false
  const inHome = ownProps.location.pathname === '/' ? true : false
  return {
    hasResults,
    loading: state.search.loading,
    showInCenter: !hasResults && inHome,
    error: state.search.error
  }
})(SearchBar))
