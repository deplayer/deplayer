import { useMemo } from 'react'
import { Formik, Form } from 'formik'
import { Translate } from 'react-redux-i18n'
import { useStore } from '@livestore/react'
import { useDispatch } from 'react-redux'

import * as types from '../../constants/ActionTypes'
import { saveSettingsAction, initializeSettingsAction } from '../../stores/livestore/actions/settings'
import { useSettings } from '../../stores/livestore/hooks'
import SettingsBuilder from '../../services/settings/SettingsBuilder'
import MainContainer from '../common/MainContainer'
import ProviderButton from './ProviderButton'
import ProviderForm from '../Settings/ProviderForm'

const Providers = () => {
  const { store: liveStore } = useStore()
  const dispatch = useDispatch()
  
  // Read settings from LiveStore (single source of truth)
  const liveStoreSettings = useSettings()
  
  // Generate form schema based on current providers
  const settingsForm = useMemo(() => {
    const builder = new SettingsBuilder()
    return builder.getFormSchema(liveStoreSettings?.providers || {})
  }, [liveStoreSettings?.providers])

  const handleSubmit = async (values: any, actions: any) => {
    console.log('Providers handleSubmit called with values:', values)
    
    if (!liveStore) {
      console.error('LiveStore not available')
      alert('Error: LiveStore not available')
      actions.setSubmitting(false)
      return
    }

    // Ensure settings are initialized in LiveStore first
    try {
      console.log('Initializing LiveStore settings if needed...')
      await initializeSettingsAction(liveStore)
      console.log('Settings initialized')
    } catch (error) {
      console.error('Failed to initialize settings:', error)
      alert(`Error initializing settings: ${error instanceof Error ? error.message : String(error)}`)
      actions.setSubmitting(false)
      return
    }

    const settingsPayload = {
      ...(liveStoreSettings || { providers: {}, app: {} }),
      providers: values.providers
    }
    
    console.log('Settings payload to save:', settingsPayload)
    
    try {
      // Save via LiveStore
      console.log('Calling saveSettingsAction...')
      const result = await saveSettingsAction(liveStore, settingsPayload)
      console.log('saveSettingsAction result:', result)
      
      // Dispatch Redux action for side effects (notifications, etc.)
      console.log('Dispatching SETTINGS_SAVED action')
      dispatch({ 
        type: types.SETTINGS_SAVED, 
        prevSettings: result.prevSettings,
        newSettings: result.newSettings
      })
      
      console.log('Settings saved successfully!')
      actions.setSubmitting(false)
    } catch (error) {
      console.error('Failed to save settings:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
      alert(`Error saving settings: ${error instanceof Error ? error.message : String(error)}`)
      actions.setSubmitting(false)
    }
  }

  // Get unique provider types (remove numeric suffixes)
  const getProviderType = (key: string) => key.replace(/[0-9]+$/, '')
  const uniqueProviders = Array.from(
    new Set(
      Object.keys(settingsForm.providers)
        .map(getProviderType)
    )
  )

  const providers = uniqueProviders.map((providerKey) => {
    return (
      <ProviderForm
        key={providerKey}
        settings={liveStoreSettings}
        settingsForm={settingsForm}
        dispatch={dispatch}
        providerKey={providerKey}
      />
    )
  })

  // Show loading state while settings are being fetched
  if (!liveStoreSettings) {
    return (
      <MainContainer centerContents>
        <div className='w-full pb-24'>
          <div className='my-3 flex flex-col'>
            <h2 className='py-4 text-xl'><Translate value="labels.lazyProviders" /></h2>
            <p>Loading settings...</p>
          </div>
        </div>
      </MainContainer>
    )
  }

  return (
    <MainContainer centerContents>
        <div className='w-full pb-24'>
          <div className='my-3 flex flex-col'>
            <h2 className='py-4 text-xl'><Translate value="labels.lazyProviders" /></h2>

            Select one of the providers below to configure it.

            <div className='flex pt-2'>
              <ProviderButton providerKey='subsonic' />
              <ProviderButton providerKey='mstream' />
              <ProviderButton providerKey='itunes' />
              <ProviderButton providerKey='jellyfin' />
              <ProviderButton providerKey='musicbrainz' />
            </div>
          </div>

          <Formik
            initialValues={{
              providers: liveStoreSettings.providers || {}
            }}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {() => (
              <Form
                className='settings-form'
              >
                <div className='flex flex-wrap'>
                  {providers}
                </div>

                <div className='w-full flex justify-end mt-12'>
                  {!!providers.length && (
                    <div className="flex justify-end">
                      <button type="submit" className="btn btn-primary"><Translate value="buttons.saveSettings" /> </button>
                    </div>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
    </MainContainer>
  )
}

export default Providers
