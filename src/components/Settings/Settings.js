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

export const formSchema = {
  fields: [
    {title: <Translate value="labels.mstream" />, type: 'title'},
    {title: <Translate value="labels.enabled" />, name: 'providers.mstream.enabled', type: 'checkbox'},
    {title: <Translate value="labels.mstream.baseUrl" />, name: 'providers.mstream.baseUrl', type: 'url'},
    {title: <Translate value="labels.subsonic" />, type: 'title'},
    {title: <Translate value="labels.enabled" />, name: 'providers.subsonic.enabled', type: 'checkbox'},
    {title: <Translate value="labels.subsonic.baseUrl" />, name: 'providers.subsonic.baseUrl', type: 'url'},
    {title: <Translate value="labels.subsonic.user" />, name: 'providers.subsonic.user', type: 'text'},
    {title: <Translate value="labels.subsonic.password" />, name: 'providers.subsonic.password', type: 'password'},
  ]
}

class Settings extends Component<Props, State> {
  render() {
    return (
      <div className='settings'>
        <SettingsForm
          schema={formSchema}
          settings={this.props.settings}
          dispatch={this.props.dispatch}
        />
      </div>
    )
  }
}

export default Settings
