import { useState, useMemo, useCallback } from 'react'
import { Formik, Form } from 'formik'
import { Translate } from 'react-redux-i18n'
import { useStore } from '@livestore/react'
import { useDispatch } from 'react-redux'

import * as types from '../../constants/ActionTypes'
import { saveSettingsAction, initializeSettingsAction } from '../../stores/livestore/actions/settings'
import { useSettings } from '../../stores/livestore/hooks'
import SettingsBuilder from '../../services/settings/SettingsBuilder'
import providerBuilders from '../../services/settings/providers'
import MainContainer from '../common/MainContainer'
import ProviderButton from './ProviderButton'
import ProviderForm from '../Settings/ProviderForm'

const Providers = () => {
  const { store: liveStore } = useStore()
  const dispatch = useDispatch()
  
  // Read settings from LiveStore (single source of truth for saved data)
  const liveStoreSettings = useSettings()
  
  // Local state for managing providers during editing (before save)
  const [localProviders, setLocalProviders] = useState<any>(null)
  
  // Use local state if set, otherwise use LiveStore settings
  const currentProviders = localProviders || liveStoreSettings?.providers || {}
  
  // Reset local state when LiveStore settings change (after save)
  useState(() => {
    if (liveStoreSettings && !localProviders) {
      setLocalProviders(liveStoreSettings.providers)
    }
  })
  
  // Generate form schema based on current providers
  const settingsForm = useMemo(() => {
    const builder = new SettingsBuilder()
    return builder.getFormSchema(currentProviders)
  }, [currentProviders])
  
  // Helper to get next available provider ID
  const getNextProviderId = useCallback((providers: any, baseKey: string) => {
    const existingKeys = Object.keys(providers)
      .filter(key => key.startsWith(baseKey))
      .map(key => {
        const num = key.replace(baseKey, '');
        return num ? parseInt(num, 10) : 0;
      })
      .sort((a, b) => a - b);

    const nextNum = existingKeys.length > 0 ? existingKeys[existingKeys.length - 1] + 1 : 0;
    return `${baseKey}${nextNum}`;
  }, [])
  
  // Handle adding a provider
  const handleAddProvider = useCallback((providerKey: string) => {
    const providerBuilder = providerBuilders[providerKey];
    if (!providerBuilder) {
      console.warn(`Provider ${providerKey} not found`)
      return;
    }

    // For non-repeatable providers, use the base key
    const providerId = providerBuilder.isRepeatable ? 
      getNextProviderId(currentProviders, providerKey) : 
      providerKey;
    
    setLocalProviders({
      ...currentProviders,
      [providerId]: {
        enabled: false
      }
    });
  }, [currentProviders, getNextProviderId])
  
  // Handle removing a provider
  const handleRemoveProvider = useCallback((providerKey: string) => {
    const newProviders = { ...currentProviders };
    delete newProviders[providerKey];
    setLocalProviders(newProviders);
  }, [currentProviders])

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
      
      // Reset local state to match saved data
      setLocalProviders(values.providers)
      
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
        settings={{ providers: currentProviders }}
        settingsForm={settingsForm}
        onRemove={handleRemoveProvider}
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
              <ProviderButton providerKey='subsonic' onAdd={handleAddProvider} />
              <ProviderButton providerKey='mstream' onAdd={handleAddProvider} />
              <ProviderButton providerKey='itunes' onAdd={handleAddProvider} />
              <ProviderButton providerKey='jellyfin' onAdd={handleAddProvider} />
              <ProviderButton providerKey='musicbrainz' onAdd={handleAddProvider} />
            </div>
          </div>

          <Formik
            initialValues={{
              providers: currentProviders
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
