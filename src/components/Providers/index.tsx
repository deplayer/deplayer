import { useCallback, useMemo, useState } from 'react'
import { Translate } from 'react-redux-i18n'
import { useDispatch } from 'react-redux'

import { useAppStore } from '../../stores/livestore/store'
import { useSettings } from '../../stores/livestore/hooks'
import { useProviderHealth } from '../../stores/livestore/hooks/useProviderHealth'
import * as types from '../../constants/ActionTypes'
import {
  saveSettingsAction,
  initializeSettingsAction,
} from '../../stores/livestore/actions/settings'
import providerRegistry from '../../services/settings/providers'
import type { ProviderSchema } from '../../types/providers'

import MainContainer from '../common/MainContainer'
import Icon from '../common/Icon'
import AddSourceModal from './AddSourceModal'
import AddSourcePicker from './AddSourcePicker'
import ConnectionCard from './ConnectionCard'
import RemoveConnectionDialog from './RemoveConnectionDialog'
import providerFactory from './providerFactory'
import { titleFor } from './title'

type ProviderConfig = Record<string, unknown> & { enabled?: boolean; name?: string }
type ProvidersMap = Record<string, ProviderConfig>

const getProviderType = (instanceKey: string) => instanceKey.replace(/[0-9]+$/, '')

const nextRepeatableKey = (providers: ProvidersMap, base: string) => {
  if (!providers[base]) return base
  let i = 1
  while (providers[`${base}${i}`]) i += 1
  return `${base}${i}`
}

const emptyConfigFor = (schema: ProviderSchema): ProviderConfig => {
  const out: ProviderConfig = { enabled: true }
  for (const f of schema.fields) {
    if (f.key === 'enabled') continue
    out[f.key] = f.type === 'boolean' ? (f.default ?? false) : ''
  }
  return out
}


type ConnectionCardConnectedProps = {
  instanceKey: string
  config: ProviderConfig
  schema: ProviderSchema
  onSave: (instanceKey: string, slice: ProviderConfig) => void | Promise<void>
  onRemove: (instanceKey: string) => void
  onToggleEnabled: (instanceKey: string, enabled: boolean) => void
}

const ConnectionCardConnected = (props: ConnectionCardConnectedProps) => {
  const { result, refresh } = useProviderHealth(props.instanceKey, props.config, providerFactory)
  return (
    <ConnectionCard
      instanceKey={props.instanceKey}
      schema={props.schema}
      config={props.config}
      health={result}
      onSave={async (key, slice) => { await props.onSave(key, slice); refresh() }}
      onRemove={props.onRemove}
      onToggleEnabled={props.onToggleEnabled}
      onTestConnection={() => refresh()}
    />
  )
}

const Providers = () => {
  const store = useAppStore()
  const dispatch = useDispatch()
  const settings = useSettings()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)

  const providers: ProvidersMap = useMemo(
    () => ((settings?.providers as ProvidersMap | undefined) ?? {}),
    [settings],
  )

  const instanceKeys = useMemo(() => Object.keys(providers), [providers])
  const configuredTypes = useMemo(
    () => Array.from(new Set(instanceKeys.map(getProviderType))),
    [instanceKeys],
  )

  const persist = useCallback(async (nextProviders: ProvidersMap) => {
    if (!store) return
    await initializeSettingsAction(store)
    const payload = { ...(settings ?? { providers: {}, app: {} }), providers: nextProviders }
    const result = await saveSettingsAction(store, payload)
    dispatch({
      type: types.SETTINGS_SAVED,
      prevSettings: result.prevSettings,
      newSettings: result.newSettings,
    })
  }, [store, settings, dispatch])

  const saveOne = useCallback(async (instanceKey: string, slice: ProviderConfig) => {
    const next: ProvidersMap = {
      ...providers,
      [instanceKey]: { ...(providers[instanceKey] ?? {}), ...slice },
    }
    await persist(next)
  }, [providers, persist])

  const removeOne = useCallback(async (instanceKey: string) => {
    const next: ProvidersMap = { ...providers }
    delete next[instanceKey]
    await persist(next)
  }, [providers, persist])

  const toggleEnabled = useCallback(async (instanceKey: string, enabled: boolean) => {
    const current = providers[instanceKey] ?? {}
    const next: ProvidersMap = { ...providers, [instanceKey]: { ...current, enabled } }
    await persist(next)
  }, [providers, persist])

  const addOne = useCallback(async (providerKey: string) => {
    const schema = providerRegistry[providerKey]
    if (!schema) return
    const newKey = schema.repeatable
      ? nextRepeatableKey(providers, providerKey)
      : providerKey
    if (!schema.repeatable && providers[providerKey]) {
      setPickerOpen(false)
      return
    }
    const next: ProvidersMap = { ...providers, [newKey]: emptyConfigFor(schema) }
    await persist(next)
    setPickerOpen(false)
  }, [providers, persist])

  if (!settings) {
    return (
      <MainContainer centerContents>
        <div className="flex items-center gap-3 opacity-70 py-8">
          <Icon icon="faSpinner" className="animate-spin motion-reduce:animate-none" />
          <span><Translate value="providers.loading" /></span>
        </div>
      </MainContainer>
    )
  }

  const isEmpty = instanceKeys.length === 0

  if (isEmpty) {
    return (
      <MainContainer>
        <div className="max-w-3xl mx-auto py-8 pb-24 px-4 sm:px-6">
          <div className="text-center mb-8 space-y-2">
            <div className="flex justify-center">
              <Icon icon="faPlug" className="w-12 h-12 text-base-content/30" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold">
              <Translate value="providers.empty.title" />
            </h1>
            <p className="text-sm sm:text-base text-base-content/70 max-w-prose mx-auto">
              <Translate value="providers.empty.subtitle" />
            </p>
          </div>
          <AddSourcePicker configuredKeys={[]} onPick={addOne} />
        </div>
      </MainContainer>
    )
  }

  return (
    <MainContainer>
      <div className="max-w-3xl mx-auto py-8 pb-24">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl">
            <Translate value="providers.title" />
          </h1>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setPickerOpen(true)}
          >
            <Translate value="providers.addSource" />
          </button>
        </header>

        <div className="flex flex-col gap-3">
          {instanceKeys.map(instanceKey => {
            const schema = providerRegistry[getProviderType(instanceKey)]
            if (!schema) return null
            return (
              <ConnectionCardConnected
                key={instanceKey}
                instanceKey={instanceKey}
                config={providers[instanceKey]}
                schema={schema}
                onSave={saveOne}
                onRemove={key => setRemoveTarget(key)}
                onToggleEnabled={toggleEnabled}
              />
            )
          })}
        </div>

        <AddSourceModal
          open={pickerOpen}
          configuredKeys={configuredTypes}
          onPick={addOne}
          onClose={() => setPickerOpen(false)}
        />

        {removeTarget && (
          <RemoveConnectionDialog
            instanceKey={removeTarget}
            name={titleFor(
              providers[removeTarget] ?? {},
              providerRegistry[getProviderType(removeTarget)],
            )}
            onConfirm={async () => {
              const key = removeTarget
              setRemoveTarget(null)
              await removeOne(key)
            }}
            onClose={() => setRemoveTarget(null)}
          />
        )}
      </div>
    </MainContainer>
  )
}

export default Providers
