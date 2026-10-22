import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import { useAppStore } from '../../stores/livestore/store'
import { useSettings } from '../../stores/livestore/hooks'
import * as types from '../../constants/ActionTypes'
import {
  saveSettingsAction,
  initializeSettingsAction,
} from '../../stores/livestore/actions/settings'
import {
  configuredTypes,
  withAdded,
  withEnabled,
  withoutInstance,
  withSaved,
} from './connections'
import type { ProviderConfig, ProvidersMap } from './connections'

export type ProviderConnections = {
  /** False until settings have loaded from LiveStore. */
  ready: boolean
  providers: ProvidersMap
  instanceKeys: string[]
  configuredTypes: string[]
  save: (instanceKey: string, slice: ProviderConfig) => Promise<void>
  remove: (instanceKey: string) => Promise<void>
  setEnabled: (instanceKey: string, enabled: boolean) => Promise<void>
  /** No-op when the type is unknown or non-repeatable and already configured. */
  add: (type: string) => Promise<void>
}

/**
 * Owns the stored Provider connections: reads them from settings and persists
 * every change through the settings action, mirroring SETTINGS_SAVED to Redux.
 */
export const useProviderConnections = (): ProviderConnections => {
  const store = useAppStore()
  const dispatch = useDispatch()
  const settings = useSettings()

  const providers: ProvidersMap = useMemo(
    () => (settings?.providers as ProvidersMap | undefined) ?? {},
    [settings],
  )
  const instanceKeys = useMemo(() => Object.keys(providers), [providers])
  const kinds = useMemo(() => configuredTypes(providers), [providers])

  const persist = useCallback(async (next: ProvidersMap) => {
    if (!store) return
    await initializeSettingsAction(store)
    const payload = { ...(settings ?? { providers: {}, app: {} }), providers: next }
    const result = await saveSettingsAction(store, payload)
    dispatch({
      type: types.SETTINGS_SAVED,
      prevSettings: result.prevSettings,
      newSettings: result.newSettings,
    })
  }, [store, settings, dispatch])

  const save = useCallback(
    (key: string, slice: ProviderConfig) => persist(withSaved(providers, key, slice)),
    [providers, persist],
  )
  const remove = useCallback(
    (key: string) => persist(withoutInstance(providers, key)),
    [providers, persist],
  )
  const setEnabled = useCallback(
    (key: string, enabled: boolean) => persist(withEnabled(providers, key, enabled)),
    [providers, persist],
  )
  const add = useCallback(async (type: string) => {
    const next = withAdded(providers, type)
    if (next) await persist(next)
  }, [providers, persist])

  return {
    ready: settings !== null,
    providers,
    instanceKeys,
    configuredTypes: kinds,
    save,
    remove,
    setEnabled,
    add,
  }
}
