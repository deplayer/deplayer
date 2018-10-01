import { connect } from 'react-redux'
import SearchBar from '../components/SearchBar/SearchBar'

export default connect((state) => ({
  loading: state.search.loading
}))(SearchBar)
