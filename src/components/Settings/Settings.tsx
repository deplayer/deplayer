import * as React from 'react'
import { Translate } from 'react-redux-i18n'
import { Dispatch } from 'redux'
import { Route } from 'react-router-dom'

import * as types from '../../constants/ActionTypes'
import SettingsForm from './SettingsForm'
import ProviderButton from './ProviderButton'
import ProviderForm from './ProviderForm'

type Props = {
  dispatch: Dispatch,
  settings: any
}

type State = {}

class Settings extends React.Component<Props, State> {
  deleteCollection = () => {
    this.props.dispatch({type: types.DELETE_COLLECTION})
  }

  deleteSettings = () => {
    this.props.dispatch({type: types.DELETE_SETTINGS})
  }

  render() {
    const settingsForm = this.props.settings.settingsForm

    return (
      <div className='settings'>
        <Route path="/settings/providers/subsonic-0" component={ProviderForm} />
        <Route exact path="/settings" component={() =>
          <SettingsForm
            schema={settingsForm}
            settings={this.props.settings}
            dispatch={this.props.dispatch}
          />
        } />
        <div className='btn-group'>
          <ProviderButton providerKey='subsonic-0' />
          <button className='with-bg btn btn-danger' onClick={this.deleteCollection}>
            <Translate value="labels.deleteCollection" />
          </button>
          <button className='with-bg btn btn-danger' onClick={this.deleteSettings}>
            <Translate value="labels.deleteSettings" />
          </button>
        </div>
      </div>
    )
  }
}

export default Settings
