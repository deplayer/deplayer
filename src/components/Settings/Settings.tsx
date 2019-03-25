import * as React from 'react'
import { Translate } from 'react-redux-i18n'
import { Dispatch } from 'redux'

import { DELETE_COLLECTION } from '../../constants/ActionTypes'
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
    this.props.dispatch({type: DELETE_COLLECTION})
  }

  render() {
    return (
      <div className='settings'>
        <SettingsForm
          schema={formSchema(new SettingsBuilder())}
          settings={this.props.settings}
          dispatch={this.props.dispatch}
        />
        <button className='with-bg' onClick={this.deleteCollection}><Translate value="labels.deleteCollection" /></button>
      </div>
    )
  }
}

export default Settings
