import { useDispatch, useSelector } from 'react-redux'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'

import { Repl } from '@electric-sql/pglite-repl'

import { getClient } from '../../services/database/PgliteDatabase'
import Button from '../common/Button'
import Importer from '../Importer'
import MainContainer from '../common/MainContainer'
import SettingsForm from './SettingsForm'
import * as types from '../../constants/ActionTypes'
import { State as SettingsState } from '../../reducers/settings'

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

  const importCollection = (data: any) => {
    try {
      const collectionImport = JSON.parse(data)
      dispatch({ type: types.IMPORT_COLLECTION, data: collectionImport })
    } catch (e: any) {
      dispatch({ type: types.IMPORT_COLLECTION_REJECTED, error: e.message })
    }
  }

  const toggleImporter = () => setShowImporter(true)

  const deleteSettings = () => {
    dispatch({ type: types.DELETE_SETTINGS })
  }

  const settingsForm = settings.settingsForm
  const ImporterComp = showImporter ? <Importer onLoaded={importCollection} /> : null
  const pg = getClient()

  if (!pg) {
    return <MainContainer centerContents>Loading...</MainContainer>
  }

  return (
    <MainContainer centerContents>
      <div className='flex flex-col'>
        <div className='pt-10'>
          <Repl pg={pg} />
        </div>

        <SettingsForm
          schema={settingsForm}
          settings={settings}
          dispatch={dispatch}
        />
        <div className='my-12 flex'>
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
    </MainContainer>
  )
}

export default Settings
