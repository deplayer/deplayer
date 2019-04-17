import * as React from 'react'
import { Translate } from 'react-redux-i18n'
import { Dispatch } from 'redux'

import * as types from '../../constants/ActionTypes'
import SettingsForm from './SettingsForm'

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

  addProvider = (providerId: string): any => {
    this.props.dispatch({type: types.ADD_PROVIDER, providerId})
  }

  render() {
    const settingsForm = this.props.settings.settingsForm

    return (
      <div className='settings'>
        <SettingsForm
          schema={settingsForm}
          settings={this.props.settings}
          dispatch={this.props.dispatch}
        />
        <div className='btn-group'>
          <button className='with-bg' onClick={() => this.addProvider('subsonic')}>
            <Translate value="buttons.addProvider" />
          </button>
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
