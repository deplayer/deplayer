import { useDispatch, useSelector } from 'react-redux'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'

import Button from '../common/Button'
import Importer from '../Importer'
import MainContainer from '../common/MainContainer'
import { SettingsForm } from './SettingsForm'
import * as types from '../../constants/ActionTypes'
import { State as SettingsState } from '../../reducers/settings'
import CenteredMessage from '../common/CenteredMessage'

interface CollectionData {
  [key: string]: unknown;
}

const Settings: React.FC = () => {
  const dispatch = useDispatch()
  const settings = useSelector((state: { settings: SettingsState }) => state.settings)
  const [showImporter, setShowImporter] = React.useState(false)

  const deleteCollection = () => {
    dispatch({ type: types.DELETE_COLLECTION })
  }

  const exportCollection = () => {
    dispatch({ type: types.EXPORT_COLLECTION })
  }

  const importCollection = (data: string) => {
    try {
      const collectionImport = JSON.parse(data) as CollectionData
      dispatch({ type: types.IMPORT_COLLECTION, data: collectionImport })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      dispatch({ type: types.IMPORT_COLLECTION_REJECTED, error: errorMessage })
    }
  }

  const toggleImporter = () => setShowImporter(true)

  const deleteSettings = () => {
    dispatch({ type: types.DELETE_SETTINGS })
  }

  const settingsForm = settings.settingsForm
  const ImporterComp = showImporter ? <Importer onLoaded={importCollection} /> : null

  return (
    <MainContainer centerContents>
      <CenteredMessage>
        <div className='flex flex-col pt-12'>
          <h2 className='text-2xl py-3 text-base-content'>
            <Translate value="labels.settingsDescription" />
          </h2>

          <SettingsForm
            schema={settingsForm}
            settings={settings}
            dispatch={dispatch}
          />

          <div className='my-12'>
            <h2 className='text-2xl py-3 text-base-content'><Translate value="labels.actions" /></h2>
            <div className='flex'>
              <Button onClick={exportCollection} inverted>
                <Translate value="labels.exportCollection" />
              </Button>
              <Button onClick={toggleImporter} inverted>
                <Translate value="labels.importCollection" />
              </Button>
              <Button onClick={deleteCollection} inverted>
                <Translate value="labels.deleteCollection" />
              </Button>
              <Button onClick={deleteSettings} inverted>
                <Translate value="labels.deleteSettings" />
              </Button>
              {ImporterComp}
            </div>
          </div>
        </div>
      </CenteredMessage>
    </MainContainer>
  )
}

export default Settings
