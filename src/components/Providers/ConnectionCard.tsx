import { useMemo, useState } from 'react'
import { Formik, Form, Field, type FormikHelpers } from 'formik'
import { Translate } from 'react-redux-i18n'
import classNames from 'classnames'

import type { HealthCheckResult, ProviderSchema, BuiltFieldSchema } from '../../types/providers'
import { hostnameOf, titleFor } from './title'
import FormFieldRow from '../Settings/FormField'
import StatusDot from './StatusDot'
import Icon from '../common/Icon'

type ProviderConfig = Record<string, unknown> & { enabled?: boolean; name?: string }

type Props = {
  instanceKey: string
  schema: ProviderSchema
  config: ProviderConfig
  health: HealthCheckResult
  onSave: (instanceKey: string, slice: ProviderConfig) => void | Promise<void>
  onRemove: (instanceKey: string) => void
  onToggleEnabled: (instanceKey: string, enabled: boolean) => void
  onTestConnection?: (instanceKey: string) => void
}


const buildFields = (schema: ProviderSchema): BuiltFieldSchema[] =>
  schema.fields
    .filter(f => f.key !== 'enabled')
    .map(f => ({ ...f, name: f.key }))

const initialValuesFor = (config: ProviderConfig, schema: ProviderSchema) => {
  const out: Record<string, unknown> = { name: typeof config.name === 'string' ? config.name : '' }
  for (const field of schema.fields) {
    if (field.key === 'enabled') continue
    out[field.key] = config[field.key] ?? (field.type === 'boolean' ? false : '')
  }
  return out
}

const validate = (values: Record<string, unknown>, schema: ProviderSchema) => {
  const errors: Record<string, string> = {}
  for (const field of schema.fields) {
    if (field.key === 'enabled') continue
    if (field.required) {
      const v = values[field.key]
      if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
        errors[field.key] = `${field.label} is required`
      }
    }
  }
  return errors
}

const shouldAutoExpand = (health: HealthCheckResult, hasRequiredEmpty: boolean) =>
  health.status === 'authFailed' || health.status === 'unreachable' || hasRequiredEmpty

export const ConnectionCard = ({
  instanceKey,
  schema,
  config,
  health,
  onSave,
  onRemove,
  onToggleEnabled,
  onTestConnection,
}: Props) => {
  const fields = useMemo(() => buildFields(schema), [schema])

  const initial = useMemo(() => initialValuesFor(config, schema), [config, schema])
  const requiredEmpty = useMemo(
    () => schema.fields.some(f => f.required && (config[f.key] === undefined || config[f.key] === '')),
    [config, schema],
  )

  // 'auto' lets shouldAutoExpand decide. Once the user clicks the row, the
  // choice sticks until they click again. Status changes do not override it.
  const [userToggle, setUserToggle] = useState<'auto' | 'open' | 'closed'>('auto')
  const expanded = userToggle === 'auto'
    ? shouldAutoExpand(health, requiredEmpty)
    : userToggle === 'open'
  const toggleExpanded = () => setUserToggle(expanded ? 'closed' : 'open')

  const enabled = config.enabled !== false
  const title = titleFor(config, schema)
  const urlField = schema.fields.find(f => f.type === 'url')
  const subtitle = urlField ? (typeof config[urlField.key] === 'string' ? hostnameOf(config[urlField.key]) ?? '' : '') : ''

  const [menuOpen, setMenuOpen] = useState(false)

  const handleSubmit = async (
    values: Record<string, unknown>,
    helpers: FormikHelpers<Record<string, unknown>>,
  ) => {
    const slice: ProviderConfig = { ...config }
    for (const k of Object.keys(values)) {
      const v = values[k]
      if (k === 'name') {
        if (typeof v === 'string' && v.trim() !== '') slice.name = v.trim()
        else delete slice.name
      } else {
        slice[k] = v
      }
    }
    await onSave(instanceKey, slice)
    helpers.resetForm({ values })
  }

  return (
    <article
      data-testid={`connection-card-${instanceKey}`}
      className={classNames(
        'rounded-lg border border-base-300 bg-base-100',
        health.status === 'authFailed' || health.status === 'unreachable' ? 'border-error/40' : '',
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <StatusDot status={enabled ? health.status : 'disabled'} />
        <button
          type="button"
          onClick={toggleExpanded}
          className="flex-1 min-w-0 text-left"
          aria-expanded={expanded}
          aria-controls={`connection-card-body-${instanceKey}`}
        >
          <div className="flex items-baseline gap-2">
            <span data-testid={`card-title-${instanceKey}`} className="font-medium truncate">{title}</span>
          </div>
          <div className="text-xs opacity-70 truncate flex flex-wrap items-center gap-x-2">
            {subtitle && <span data-testid={`card-subtitle-${instanceKey}`} className="font-mono">{subtitle}</span>}
            {subtitle && <span aria-hidden="true">·</span>}
            <span className="flex gap-1.5">
              {schema.capabilities.map(cap => (
                <span key={cap} className="uppercase tracking-wider">
                  <Translate value={`providers.capabilities.${cap}`} />
                </span>
              ))}
            </span>
            {health.error && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-error truncate">{health.error}</span>
              </>
            )}
          </div>
        </button>
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            role="switch"
            aria-label={`enable ${title}`}
            className="toggle toggle-primary toggle-sm"
            checked={enabled}
            onChange={e => onToggleEnabled(instanceKey, e.target.checked)}
          />
        </label>
        <div className="relative">
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            aria-label="More actions"
            onClick={() => setMenuOpen(o => !o)}
          >
            <Icon icon="faEllipsisV" />
          </button>
          {menuOpen && (
            <ul
              className="absolute right-0 top-full mt-1 z-10 menu menu-sm bg-base-200 rounded-box shadow w-48"
              role="menu"
            >
              {onTestConnection && (
                <li>
                  <button type="button" onClick={() => { setMenuOpen(false); onTestConnection(instanceKey) }}>
                    <Translate value="providers.testConnection" />
                  </button>
                </li>
              )}
              <li>
                <button type="button" className="text-error" onClick={() => { setMenuOpen(false); onRemove(instanceKey) }}>
                  <Translate value="providers.remove.menuItem" />
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>

      {expanded && (
        <div id={`connection-card-body-${instanceKey}`} className="px-4 pb-4">
          <Formik
            initialValues={initial}
            enableReinitialize={false}
            validate={values => validate(values, schema)}
            onSubmit={handleSubmit}
          >
            {({ dirty, isValid, resetForm, isSubmitting }) => (
              <Form>
                <div className="border-t border-base-300 pt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <label htmlFor={`${instanceKey}-name`} className="w-32 text-sm opacity-70">
                      <Translate value="providers.labelField" />
                    </label>
                    <Field
                      id={`${instanceKey}-name`}
                      name="name"
                      type="text"
                      className="input input-bordered input-sm flex-1"
                      placeholder={subtitle || title}
                    />
                  </div>
                  {fields.map(field => (
                    <div
                      key={field.key}
                      data-testid={`field-row-${instanceKey}-${field.key}`}
                      className="flex items-center gap-3"
                    >
                      <label className="w-32 text-sm opacity-70 capitalize" htmlFor={`${instanceKey}-${field.key}`}>
                        <Translate value={field.label} />
                      </label>
                      <div className="flex-1">
                        <FormFieldRow field={{ ...field, name: field.key }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-2 mt-4">
                  {onTestConnection && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm mr-auto"
                      onClick={() => onTestConnection(instanceKey)}
                    >
                      <Translate value="providers.testConnection" />
                    </button>
                  )}
                  {dirty && (
                    <>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => resetForm()}
                      >
                        <Translate value="providers.remove.cancel" />
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={!isValid || isSubmitting}
                      >
                        <Translate value="buttons.saveSettings" />
                      </button>
                    </>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}
    </article>
  )
}

export default ConnectionCard
