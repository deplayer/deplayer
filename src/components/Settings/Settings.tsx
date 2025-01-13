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
import CenteredMessage from '../common/CenteredMessage'

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
    return (
      <CenteredMessage>
        <div>Loading...</div>
      </CenteredMessage>
    )
  }

  return (
    <MainContainer centerContents>
      <CenteredMessage>
        <div className='flex flex-col'>
          <SettingsForm
            schema={settingsForm}
            settings={settings}
            dispatch={dispatch}
          />
          <div className='pt-10'>
            <h2 className='text-2xl py-3 text-base-content'><Translate value="labels.pgliteRepl" /></h2>
            <p className='text-base-content'>
              <Translate value="labels.pgliteReplDescription" />
            </p>
            <Repl pg={pg} />
          </div>

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
