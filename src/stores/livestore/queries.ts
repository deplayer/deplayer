import { queryDb } from '@livestore/livestore'
import { tables } from './schema.js'

// Query to get settings by id (default: 'settings')
export const settings$ = (id: string = 'settings') =>
  queryDb(
    () => tables.settings.where({ id }).first({ fallback: () => null }),
    { label: `settings-${id}` }
  )

// Query to get all settings (for future use if needed)
export const allSettings$ = queryDb(
  () => tables.settings,
  { label: 'allSettings' }
)

