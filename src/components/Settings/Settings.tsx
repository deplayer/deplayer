import * as React from 'react'
import { Translate } from 'react-redux-i18n'
import { Dispatch } from 'redux'

import * as types from '../../constants/ActionTypes'
import SettingsForm from './SettingsForm'
import { ISettingsBuilder } from '../../interfaces/ISettingsBuilder'
import SettingsBuilder from '../../services/settings/SettingsBuilder'

type Props = {
  dispatch: Dispatch,
  settings: any
}

type State = {}

export const formSchema = (settingsBuilder: ISettingsBuilder) => {
  return settingsBuilder.getFormSchema()
}

class Settings extends React.Component<Props, State> {
  deleteCollection = () => {
    this.props.dispatch({type: types.DELETE_COLLECTION})
  }

  deleteSettings = () => {
    this.props.dispatch({type: types.DELETE_SETTINGS})
  }

  render() {
    return (
      <div className='settings'>
        <SettingsForm
          schema={formSchema(new SettingsBuilder())}
          settings={this.props.settings}
          dispatch={this.props.dispatch}
        />
        <div className='btn-group'>
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
