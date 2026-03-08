import providerRegistry from './providers'
import sectionRegistry from './sections'
import type { FormField, BuiltFieldSchema } from '../../types/providers'

export default class SettingsBuilder {
  getFormSchema(providers: Record<string, any> = {}) {
    const fields: FormField[] = []

    for (const section of Object.values(sectionRegistry)) {
      fields.push({ type: 'title', label: section.label })
      for (const field of section.fields) {
        const built: BuiltFieldSchema = {
          ...field,
          name: `app.${section.key}.${field.key}`,
        }
        fields.push(built)
      }
    }

    const providerFields: Record<string, { fields: FormField[] }> = {}

    for (const providerId of Object.keys(providers)) {
      const providerType = providerId.replace(/\d+$/, '')
      const schema = providerRegistry[providerType]

      if (!schema) {
        continue
      }

      const pFields: FormField[] = []

      pFields.push({ type: 'title', label: schema.label })

      for (const field of schema.fields) {
        const built: BuiltFieldSchema = {
          ...field,
          name: `providers.${providerId}.${field.key}`,
        }
        pFields.push(built)
      }

      if (schema.capabilities.includes('sync')) {
        pFields.push({ type: 'sync', providerKey: providerId })
      }

      providerFields[providerId] = { fields: pFields }
    }

    return {
      providers: providerFields,
      fields,
    }
  }
}
