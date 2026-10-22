import providersIndex from './index'
import providerSchemas from '../services/settings/providers'
import type { NormalizedMedia } from '../utils/normalizeMedia'
import type { IMusicProvider } from './IMusicProvider'
import type { ProviderSchema } from '../types/providers'

/**
 * The one place that knows how a settings key ("subsonic", "subsonic2")
 * maps to a Provider type, its form schema, and its implementation.
 *
 * A settings key is `<type>` for the first instance and `<type><n>` for
 * repeats; `providerKey` on a constructed provider is always the TYPE (it is
 * persisted on media rows as the display-only `stream.service`).
 */

export type ProviderInstance = Partial<IMusicProvider> & {
  search(searchTerm: string): Promise<NormalizedMedia[]>
}

type ProviderConstructor = new (settings: never, providerKey: string) => ProviderInstance

const constructors = providersIndex as unknown as Record<string, ProviderConstructor>

/** "subsonic2" -> "subsonic". */
export const providerTypeOf = (instanceKey: string): string => instanceKey.replace(/\d+$/, '')

export const providerSchemaOf = (instanceKey: string): ProviderSchema | undefined =>
  providerSchemas[providerTypeOf(instanceKey)]

/** First free settings key for a new instance of `type` ("subsonic", "subsonic1", ...). */
export const nextInstanceKey = (existingKeys: Iterable<string>, type: string): string => {
  const taken = new Set(existingKeys)
  if (!taken.has(type)) return type
  let i = 1
  while (taken.has(`${type}${i}`)) i += 1
  return `${type}${i}`
}

/** Blank config for a new instance: enabled, every credential field empty. */
export const emptyConfigFor = (schema: ProviderSchema): Record<string, unknown> => {
  const out: Record<string, unknown> = { enabled: true }
  for (const f of schema.fields) {
    if (f.key === 'enabled') continue
    out[f.key] = f.type === 'boolean' ? (f.default ?? false) : ''
  }
  return out
}

/**
 * Constructs the Provider for a settings key, or undefined when the type has
 * no implementation (e.g. musicbrainz is metadata-only) or construction throws.
 */
export const createProvider = (
  instanceKey: string,
  config: Record<string, unknown>,
): ProviderInstance | undefined => {
  const type = providerTypeOf(instanceKey)
  const Ctor = constructors[type]
  if (!Ctor) return undefined
  try {
    return new Ctor(config as never, type)
  } catch {
    return undefined
  }
}
