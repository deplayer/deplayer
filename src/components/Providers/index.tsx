import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Formik, Form } from 'formik'
import { Translate } from 'react-redux-i18n'
import { useAppStore } from '../../stores/livestore/store'
import { useDispatch } from 'react-redux'

import * as types from '../../constants/ActionTypes'
import { saveSettingsAction, initializeSettingsAction } from '../../stores/livestore/actions/settings'
import { useSettings } from '../../stores/livestore/hooks'
import SettingsBuilder from '../../services/settings/SettingsBuilder'
import providerRegistry from '../../services/settings/providers'
import MainContainer from '../common/MainContainer'
import ProviderButton from './ProviderButton'
import ProviderForm from '../Settings/ProviderForm'
import Icon from '../common/Icon'

const Providers = () => {
  const liveStore = useAppStore()
  const dispatch = useDispatch()
  
  // Read settings from LiveStore (single source of truth for saved data)
  const liveStoreSettings = useSettings()
  
  // Local state for managing providers during editing (before save)
  const [localProviders, setLocalProviders] = useState<Record<string, Record<string, unknown>> | null>(null)
  
  // Save feedback state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string>('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Auto-dismiss save feedback after 3 seconds
  useEffect(() => {
    if (saveStatus !== 'idle') {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000)
    }
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [saveStatus])

  // Use local state if set, otherwise use LiveStore settings
  const currentProviders = useMemo(
    () => localProviders ?? liveStoreSettings?.providers ?? {},
    [localProviders, liveStoreSettings?.providers]
  )
  
  // Generate form schema based on current providers
  const settingsForm = useMemo(() => {
    const builder = new SettingsBuilder()
    return builder.getFormSchema(currentProviders)
  }, [currentProviders])
  
  // Helper to get next available provider ID
  const getNextProviderId = useCallback((providers: Record<string, unknown>, baseKey: string) => {
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
    const schema = providerRegistry[providerKey];
    if (!schema) {
      console.warn(`Provider ${providerKey} not found`)
      return;
    }

    // For non-repeatable providers, use the base key
    const providerId = schema.repeatable ? 
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

  const handleSubmit = async (values: { providers: Record<string, Record<string, unknown>> }, actions: { setSubmitting: (submitting: boolean) => void }) => {
    if (!liveStore) {
      console.error('LiveStore not available')
      setSaveError('LiveStore not available')
      setSaveStatus('error')
      actions.setSubmitting(false)
      return
    }

    // Ensure settings are initialized in LiveStore first
    try {
      await initializeSettingsAction(liveStore)
    } catch (error) {
      console.error('Failed to initialize settings:', error)
      setSaveError(error instanceof Error ? error.message : String(error))
      setSaveStatus('error')
      actions.setSubmitting(false)
      return
    }

    const settingsPayload = {
      ...(liveStoreSettings || { providers: {}, app: {} }),
      providers: values.providers
    }
    
    try {
      // Save via LiveStore
      const result = await saveSettingsAction(liveStore, settingsPayload)
      
      // Reset local state to match saved data
      setLocalProviders(values.providers)
      
      // Dispatch Redux action for side effects (notifications, etc.)
      dispatch({ 
        type: types.SETTINGS_SAVED, 
        prevSettings: result.prevSettings,
        newSettings: result.newSettings
      })
      
      setSaveStatus('saved')
      actions.setSubmitting(false)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveError(error instanceof Error ? error.message : String(error))
      setSaveStatus('error')
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
            <p>Loading settings…</p>
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

            <div className='flex flex-wrap gap-2 pt-2'>
              {Object.keys(providerRegistry).map(key => (
                <ProviderButton key={key} providerKey={key} onAdd={handleAddProvider} />
              ))}
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

                <div className='w-full flex justify-end items-center gap-4 mt-12'>
                  {saveStatus === 'saved' && (
                    <div className="alert alert-success shadow-lg py-2 px-4 w-auto">
                      <Icon icon="faCheck" />
                      <span><Translate value="notifications.settings.saved" /></span>
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="alert alert-error shadow-lg py-2 px-4 w-auto">
                      <Icon icon="faExclamationTriangle" />
                      <span>{saveError || 'Error saving settings'}</span>
                    </div>
                  )}
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
