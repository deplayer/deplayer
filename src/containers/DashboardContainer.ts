import { connect } from 'react-redux'

import Dashboard from '../components/Dashboard'
import { State as RootState } from '../reducers'

export default connect(
  (state: RootState) => ({
    collection: state.collection
  })
)(Dashboard)
