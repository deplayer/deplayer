import * as React from 'react'
import { Translate } from 'react-redux-i18n'
import { Dispatch } from 'redux'

import { DELETE_COLLECTION } from '../../constants/ActionTypes'
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
    {title: <Translate value="labels.itunes" />, type: 'title'},
    {title: <Translate value="labels.enabled" />, name: 'providers.itunes.enabled', type: 'checkbox'},
  ]
}

class Settings extends React.Component<Props, State> {
  deleteCollection = () => {
    this.props.dispatch({type: DELETE_COLLECTION})
  }

  render() {
    return (
      <div className='settings'>
        <SettingsForm
          schema={formSchema}
          settings={this.props.settings}
          dispatch={this.props.dispatch}
        />
        <button className='with-bg' onClick={this.deleteCollection}><Translate value="labels.deleteCollection" /></button>
      </div>
    )
  }
}

export default Settings