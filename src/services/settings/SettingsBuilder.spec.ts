import { describe, it, expect } from 'vitest'
import SettingsBuilder from './SettingsBuilder'

describe('SettingsBuilder', () => {
  it('should generate schema with sections only when no providers given', () => {
    const builder = new SettingsBuilder()
    const schema = builder.getFormSchema()

    expect(schema.providers).toBeDefined()
    expect(schema.fields).toBeDefined()
    expect(Object.keys(schema.providers)).toHaveLength(0)
    expect(schema.fields.length).toBeGreaterThan(0)

    // Section title fields present
    const titles = schema.fields.filter((f: any) => f.type === 'title')
    expect(titles.length).toBeGreaterThan(0)

    // Section data fields have correct name prefix
    const dataFields = schema.fields.filter((f: any) => f.name)
    expect(dataFields.every((f: any) => f.name.startsWith('app.'))).toBe(true)
  })

  it('should include provider fields when providers are given', () => {
    const builder = new SettingsBuilder()
    const schema = builder.getFormSchema({ subsonic0: {} })

    expect(schema.providers.subsonic0).toBeDefined()
    const pFields = schema.providers.subsonic0.fields

    // Title field
    expect(pFields[0]).toEqual({ type: 'title', label: 'labels.subsonic' })

    // Data fields have correct name prefix
    const named = pFields.filter((f: any) => f.name)
    expect(named.every((f: any) => f.name.startsWith('providers.subsonic0.'))).toBe(true)

    // Sync pseudo-field present (subsonic has sync capability)
    const syncField = pFields.find((f: any) => f.type === 'sync')
    expect(syncField).toEqual({ type: 'sync', providerKey: 'subsonic0' })
  })

  it('should skip unknown provider types', () => {
    const builder = new SettingsBuilder()
    const schema = builder.getFormSchema({ unknown0: {} })

    expect(Object.keys(schema.providers)).toHaveLength(0)
  })

  it('should handle non-repeatable providers without numeric suffix', () => {
    const builder = new SettingsBuilder()
    const schema = builder.getFormSchema({ itunes: {} })

    expect(schema.providers.itunes).toBeDefined()
    const named = schema.providers.itunes.fields.filter((f: any) => f.name)
    expect((named[0] as any).name).toBe('providers.itunes.enabled')
  })
})
