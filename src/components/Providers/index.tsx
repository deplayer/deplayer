import { useState } from 'react'
import { Translate } from 'react-redux-i18n'

import { useProviderHealth } from '../../stores/livestore/hooks/useProviderHealth'
import { createProvider, providerSchemaOf } from '../../providers/registry'
import type { ProviderSchema } from '../../types/providers'

import MainContainer from '../common/MainContainer'
import Icon from '../common/Icon'
import AddSourceModal from './AddSourceModal'
import AddSourcePicker from './AddSourcePicker'
import ConnectionCard from './ConnectionCard'
import RemoveConnectionDialog from './RemoveConnectionDialog'
import { titleFor } from './title'
import { useProviderConnections } from './useProviderConnections'
import type { ProviderConfig } from './connections'

type ConnectionCardConnectedProps = {
  instanceKey: string
  config: ProviderConfig
  schema: ProviderSchema
  onSave: (instanceKey: string, slice: ProviderConfig) => void | Promise<void>
  onRemove: (instanceKey: string) => void
  onToggleEnabled: (instanceKey: string, enabled: boolean) => void
}

const ConnectionCardConnected = (props: ConnectionCardConnectedProps) => {
  const { result, refresh } = useProviderHealth(props.instanceKey, props.config, createProvider)
  return (
    <ConnectionCard
      instanceKey={props.instanceKey}
      schema={props.schema}
      config={props.config}
      health={result}
      onSave={async (key, slice) => { await props.onSave(key, slice); refresh() }}
      onRemove={props.onRemove}
      onToggleEnabled={props.onToggleEnabled}
      onTestConnection={(_key, values) => refresh(values)}
    />
  )
}

const Providers = () => {
  const connections = useProviderConnections()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)

  const addAndClose = async (type: string) => {
    await connections.add(type)
    setPickerOpen(false)
  }

  if (!connections.ready) {
    return (
      <MainContainer centerContents>
        <div className="flex items-center gap-3 opacity-70 py-8">
          <Icon icon="faSpinner" className="animate-spin motion-reduce:animate-none" />
          <span><Translate value="providers.loading" /></span>
        </div>
      </MainContainer>
    )
  }

  if (connections.instanceKeys.length === 0) {
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
          <AddSourcePicker configuredKeys={[]} onPick={addAndClose} />
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
          {connections.instanceKeys.map(instanceKey => {
            const schema = providerSchemaOf(instanceKey)
            if (!schema) return null
            return (
              <ConnectionCardConnected
                key={instanceKey}
                instanceKey={instanceKey}
                config={connections.providers[instanceKey]}
                schema={schema}
                onSave={connections.save}
                onRemove={key => setRemoveTarget(key)}
                onToggleEnabled={connections.setEnabled}
              />
            )
          })}
        </div>

        <AddSourceModal
          open={pickerOpen}
          configuredKeys={connections.configuredTypes}
          onPick={addAndClose}
          onClose={() => setPickerOpen(false)}
        />

        {removeTarget && (
          <RemoveConnectionDialog
            instanceKey={removeTarget}
            name={titleFor(
              connections.providers[removeTarget] ?? {},
              providerSchemaOf(removeTarget) as ProviderSchema,
            )}
            onConfirm={async () => {
              const key = removeTarget
              setRemoveTarget(null)
              await connections.remove(key)
            }}
            onClose={() => setRemoveTarget(null)}
          />
        )}
      </div>
    </MainContainer>
  )
}

export default Providers
