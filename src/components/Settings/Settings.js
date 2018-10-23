// @flow

import React, { Component } from 'react'
import { Translate } from 'react-redux-i18n'
import { Dispatch } from 'redux'

import SettingsForm from './SettingsForm'
import { SAVE_SETTINGS } from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch,
  settings: any
}

type State = {}

class Settings extends Component<Props, State> {

  saveSettings = (form: any): any => {
    this.props.dispatch({type: SAVE_SETTINGS, settingsPayload: form})
  }

  render() {
    return (
      <div className='settings'>
        <h1><Translate value="titles.settings" /></h1>

        <h2><Translate value="titles.providers" /></h2>
        <h3><Translate value="titles.mstream" /></h3>

        <SettingsForm
          onSubmit={this.saveSettings}
          settings={this.props.settings}
        />
      </div>
    )
  }
}

export default Settings
