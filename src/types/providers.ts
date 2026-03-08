export type FieldType = 'text' | 'url' | 'password' | 'boolean' | 'number' | 'select'

export type FieldSchema = {
  key: string
  type: FieldType
  label: string
  required?: boolean
  placeholder?: string
  description?: string
  default?: string | number | boolean
  options?: Array<{ label: string; value: string }>
}

export type TitleField = {
  type: 'title'
  label: string
}

export type SyncField = {
  type: 'sync'
  providerKey: string
}

/** FieldSchema after SettingsBuilder adds the Formik field path */
export type BuiltFieldSchema = FieldSchema & { name: string }

export type FormField = BuiltFieldSchema | TitleField | SyncField

export type ProviderSchema = {
  key: string
  label: string
  repeatable: boolean
  fields: FieldSchema[]
  capabilities: Array<'sync' | 'search' | 'stream'>
}

export type SectionSchema = {
  key: string
  label: string
  fields: FieldSchema[]
}
