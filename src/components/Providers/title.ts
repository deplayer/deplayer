import type { ProviderSchema } from '../../types/providers'

type ProviderConfig = Record<string, unknown> & { name?: string }

export const hostnameOf = (url: unknown): string | null => {
  if (typeof url !== 'string' || url.length === 0) return null
  try { return new URL(url).host || null } catch { return null }
}

/**
 * Resolves the user-facing title for a provider instance. Falls back to
 * `config.name`, then the hostname of the first URL field, then the
 * schema's label key.
 */
export const titleFor = (config: ProviderConfig, schema: ProviderSchema): string => {
  if (typeof config.name === 'string' && config.name.trim()) return config.name.trim()
  const urlField = schema.fields.find(f => f.type === 'url')
  if (urlField) {
    const host = hostnameOf(config[urlField.key])
    if (host) return host
  }
  return schema.label
}
