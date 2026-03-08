import { useDispatch } from 'react-redux'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'
import { useAppStore } from '../../stores/livestore/store'

import Button from '../common/Button'
import Importer from '../Importer'
import MainContainer from '../common/MainContainer'
import * as types from '../../constants/ActionTypes'
import CenteredMessage from '../common/CenteredMessage'
import { deleteSettingsAction } from '../../stores/livestore/actions'


interface CollectionData {
  [key: string]: unknown;
}

const Settings: React.FC = () => {
  const dispatch = useDispatch()
  const liveStore = useAppStore()
  
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

  const handleDeleteSettings = async () => {
    if (!liveStore) return
    
    try {
      await deleteSettingsAction(liveStore)
      
      // Dispatch action to trigger saga side effects (reconnection, notification)
      dispatch({ type: types.SETTINGS_DELETED })
    } catch (error) {
      console.error('Failed to delete settings:', error)
    }
  }

  
  const ImporterComp = showImporter ? <Importer onLoaded={importCollection} /> : null

  return (
    <MainContainer centerContents>
      <CenteredMessage>
        <div className='flex flex-col pt-12'>
          <h2 className='text-2xl py-3 text-base-content'>
            <Translate value="labels.settingsDescription" />
          </h2>

        {/* SettingsForm temporarily disabled */}
        {/* SettingsForm temporarily disabled */}
        {/* SettingsForm temporarily disabled */}
        {/* SettingsForm temporarily disabled */}
        {/* SettingsForm temporarily disabled */}
        {/* SettingsForm temporarily disabled */}

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
              <Button onClick={handleDeleteSettings} inverted>
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
