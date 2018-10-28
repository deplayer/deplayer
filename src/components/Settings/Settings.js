// @flow

import React, { Component } from 'react'
import { Translate } from 'react-redux-i18n'
import { Dispatch } from 'redux'

import SettingsForm from './SettingsForm'

type Props = {
  dispatch: Dispatch,
  settings: any
}

type State = {}

class Settings extends Component<Props, State> {
  render() {
    const schema = {
      fields: [
        {title: <Translate value="labels.enabled" />, name: 'providers.mstream.enabled', type: 'checkbox'},
        {title: <Translate value="labels.mstream.baseUrl" />, name: 'providers.mstream.baseUrl', type: 'url'}
      ]
    }

    return (
      <div className='settings'>
        <SettingsForm
          schema={schema}
          settings={this.props.settings}
          dispatch={this.props.dispatch}
        />
      </div>
    )
  }
}

export default Settings
