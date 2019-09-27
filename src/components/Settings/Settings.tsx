import * as React from 'react'
import { Translate } from 'react-redux-i18n'
import { Dispatch } from 'redux'

import * as types from '../../constants/ActionTypes'
import SettingsForm from './SettingsForm'
import Importer from '../Importer'

type Props = {
  dispatch: Dispatch,
  settings: any
}

type State = {
  showImporter: boolean
}

class Settings extends React.Component<Props, State> {
  state = {
    showImporter: false
  }

  deleteCollection = () => {
    this.props.dispatch({type: types.DELETE_COLLECTION})
  }

  exportCollection = () => {
    this.props.dispatch({type: types.EXPORT_COLLECTION})
  }

  scanSources = () => {
    this.props.dispatch({type: types.START_SCAN_SOURCES})
  }

  importCollection = (data: any) => {
    try {
      const collectionImport = JSON.parse(data)
      this.props.dispatch({type: types.IMPORT_COLLECTION, data: collectionImport})
    } catch(e) {
      this.props.dispatch({type: types.IMPORT_COLLECTION_REJECTED, error: e.message})
    }
  }

  toggleImporter = () => this.setState({showImporter: true})

  deleteSettings = () => {
    this.props.dispatch({type: types.DELETE_SETTINGS})
  }

  render() {
    const settingsForm = this.props.settings.settingsForm
    const ImporterComp = this.state.showImporter ? <Importer onLoaded={this.importCollection} /> : null

    return (
      <div className='settings main'>
        <SettingsForm
          schema={settingsForm}
          settings={this.props.settings}
          dispatch={this.props.dispatch}
        />
        <div className='btn-group'>
          <button className='with-bg btn btn-info' onClick={this.scanSources}>
            <Translate value="labels.scanSources" />
          </button>
        </div>
        <div className='btn-group'>
          <button className='with-bg btn btn-info' onClick={this.exportCollection}>
            <Translate value="labels.exportCollection" />
          </button>
          <button className='with-bg btn btn-success' onClick={this.toggleImporter}>
            <Translate value="labels.importCollection" />
          </button>
          <button className='with-bg btn btn-danger' onClick={this.deleteCollection}>
            <Translate value="labels.deleteCollection" />
          </button>
          <button className='with-bg btn btn-danger' onClick={this.deleteSettings}>
            <Translate value="labels.deleteSettings" />
          </button>
        </div>
        <div className='btn-group'>
          { ImporterComp }
        </div>
      </div>
    )
  }
}

export default Settings
