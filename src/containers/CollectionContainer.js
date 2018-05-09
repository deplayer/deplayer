import { connect } from 'react-redux'
import Collection from '../components/Collection'

export default connect(
  (state) => (state.table)
)(Collection)
