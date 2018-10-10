import { connect } from 'react-redux'
import SearchBar from '../components/SearchBar/SearchBar'

export default connect((state) => ({
  loading: state.search.loading,
  hasResults: state.playlist.trackIds && state.playlist.trackIds.length ? true : false
}))(SearchBar)
