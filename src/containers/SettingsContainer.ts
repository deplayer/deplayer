import { connect } from 'react-redux'
import Settings from '../components/Settings/Settings'

export default connect(
  (state: { settings: any }) => ({
    settings: state.settings,
  })
)(Settings)
