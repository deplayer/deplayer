import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'

import Button from '../common/Button'
import Importer from '../Importer'
import MainContainer from '../common/MainContainer'
import SettingsForm from './SettingsForm'
import * as types from '../../constants/ActionTypes'
import { State as SettingsState } from '../../reducers/settings'

type Props = {
  dispatch: Dispatch,
  settings: SettingsState
}

type State = {
  showImporter: boolean
}

class Settings extends React.Component<Props, State> {
  state = {
    showImporter: false
  }

  deleteCollection = () => {
    this.props.dispatch({ type: types.DELETE_COLLECTION })
  }

  exportCollection = () => {
    this.props.dispatch({ type: types.EXPORT_COLLECTION })
  }

  importCollection = (data: any) => {
    try {
      const collectionImport = JSON.parse(data)
      this.props.dispatch({ type: types.IMPORT_COLLECTION, data: collectionImport })
    } catch (e: any) {
      this.props.dispatch({ type: types.IMPORT_COLLECTION_REJECTED, error: e.message })
    }
  }

  toggleImporter = () => this.setState({ showImporter: true })

  deleteSettings = () => {
    this.props.dispatch({ type: types.DELETE_SETTINGS })
  }

  render() {
    const settingsForm = this.props.settings.settingsForm
    const ImporterComp = this.state.showImporter ? <Importer onLoaded={this.importCollection} /> : null

    return (
      <MainContainer centerContents>
        <div className='flex flex-col'>
          <SettingsForm
            schema={settingsForm}
            settings={this.props.settings}
            dispatch={this.props.dispatch}
          />
          <div className='my-12 flex'>
            <Button onClick={this.exportCollection} inverted>
              <Translate value="labels.exportCollection" />
            </Button>
            <Button onClick={this.toggleImporter} inverted>
              <Translate value="labels.importCollection" />
            </Button>
            <Button onClick={this.deleteCollection} inverted>
              <Translate value="labels.deleteCollection" />
            </Button>
            <Button onClick={this.deleteSettings} inverted>
              <Translate value="labels.deleteSettings" />
            </Button>
            {ImporterComp}
          </div>
        </div>
      </MainContainer>
    )
  }
}

export default Settings
