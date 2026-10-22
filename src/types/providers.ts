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

/** FieldSchema plus the Formik field path */
export type BuiltFieldSchema = FieldSchema & { name: string }

export type ProviderSchema = {
  key: string
  label: string
  repeatable: boolean
  fields: FieldSchema[]
  capabilities: Array<'sync' | 'search' | 'stream'>
}

export type HealthStatus =
  | 'connected'
  | 'checking'
  | 'unreachable'
  | 'authFailed'
  | 'disabled'
  | 'unknown'

export type HealthCheckResult = {
  status: HealthStatus
  error?: string
  latencyMs?: number
  checkedAt: number
}
