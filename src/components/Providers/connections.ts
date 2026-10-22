import {
  emptyConfigFor,
  nextInstanceKey,
  providerSchemaOf,
  providerTypeOf,
} from '../../providers/registry'

export type ProviderConfig = Record<string, unknown> & { enabled?: boolean; name?: string }
export type ProvidersMap = Record<string, ProviderConfig>

/** Merges `slice` over the stored config of `instanceKey`. */
export const withSaved = (providers: ProvidersMap, instanceKey: string, slice: ProviderConfig): ProvidersMap => ({
  ...providers,
  [instanceKey]: { ...(providers[instanceKey] ?? {}), ...slice },
})

export const withoutInstance = (providers: ProvidersMap, instanceKey: string): ProvidersMap => {
  const next = { ...providers }
  delete next[instanceKey]
  return next
}

export const withEnabled = (providers: ProvidersMap, instanceKey: string, enabled: boolean): ProvidersMap => ({
  ...providers,
  [instanceKey]: { ...(providers[instanceKey] ?? {}), enabled },
})

/**
 * Adds a blank instance of `type`. Returns undefined when the type is unknown
 * or is non-repeatable and already configured.
 */
export const withAdded = (providers: ProvidersMap, type: string): ProvidersMap | undefined => {
  const schema = providerSchemaOf(type)
  if (!schema) return undefined
  if (!schema.repeatable && providers[type]) return undefined
  const key = schema.repeatable ? nextInstanceKey(Object.keys(providers), type) : type
  return { ...providers, [key]: emptyConfigFor(schema) }
}

/** Distinct Provider types already configured, in first-seen order. */
export const configuredTypes = (providers: ProvidersMap): string[] =>
  Array.from(new Set(Object.keys(providers).map(providerTypeOf)))
