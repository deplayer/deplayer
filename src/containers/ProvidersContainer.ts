import { connect } from 'react-redux'
import Providers from '../components/Providers'

export default connect(
  (state: { settings: any }) => ({
    settings: state.settings,
  })
)(Providers)
