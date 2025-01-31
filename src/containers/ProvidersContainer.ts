import { connect } from 'react-redux'
import Providers from '../components/Providers'
import { State as SettingsState } from '../reducers/settings'

export default connect(
  (state: { settings: SettingsState }) => ({
    settings: state.settings,
  })
)(Providers)
