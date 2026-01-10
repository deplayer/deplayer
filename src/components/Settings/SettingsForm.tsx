import { Formik, Form } from 'formik'
import { Translate } from 'react-redux-i18n'
import DatabaseSyncForm from './DatabaseSyncForm'
import { type SyncSettings } from '../../services/settings/syncSettings'
import { type UnknownAction } from 'redux'

interface SettingsFormProps {
  schema: {
    providers: Record<string, unknown>
    fields: Array<{
      title: string
      name?: string
      type: string
    }>
  }
  settings: {
    settingsForm: {
      providers: Record<string, unknown>
      fields: Array<{
        title: string
        name?: string
        type: string
      }>
    }
    settings: {
      providers: Record<string, unknown>
      app: {
        language?: {
          useSystemLanguage?: boolean
          code?: string
        }
        notifications?: {
          enabled?: boolean
          showTrackChanges?: boolean
          showErrors?: boolean
        }
        sync?: SyncSettings
      }
    }
  }
  dispatch: (action: UnknownAction) => UnknownAction
  onSave?: (settingsPayload: any) => Promise<void>
}

export const SettingsForm = ({
  settings,
  dispatch,
  onSave
}: SettingsFormProps) => {
  const handleSubmit = async (values: typeof settings.settings) => {
    if (onSave) {
      // Use LiveStore action
      await onSave(values)
    } else {
      // Fallback to Redux dispatch
      dispatch({
        type: 'SAVE_SETTINGS',
        settingsPayload: values
      })
    }
  }

  return (
    <Formik
      initialValues={settings.settings}
      onSubmit={handleSubmit}
    >
      {({ values, setFieldValue, handleChange, handleBlur }) => (
        <Form>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">
                <Translate value="labels.language" />
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="app.language.useSystemLanguage"
                  checked={values.app?.language?.useSystemLanguage}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="app.language.useSystemLanguage">
                  <Translate value="labels.useSystemLanguage" />
                </label>
              </div>
              {!values.app?.language?.useSystemLanguage && (
                <div className="flex flex-col gap-2">
                  <select
                    name="app.language.code"
                    value={values.app?.language?.code}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">
                <Translate value="labels.notifications" />
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="app.notifications.enabled"
                  checked={values.app?.notifications?.enabled}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="app.notifications.enabled">
                  <Translate value="labels.enableNotifications" />
                </label>
              </div>
              {values.app?.notifications?.enabled && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="app.notifications.showTrackChanges"
                      checked={values.app?.notifications?.showTrackChanges}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="app.notifications.showTrackChanges">
                      <Translate value="labels.showTrackChanges" />
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="app.notifications.showErrors"
                      checked={values.app?.notifications?.showErrors}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="app.notifications.showErrors">
                      <Translate value="labels.showErrors" />
                    </label>
                  </div>
                </>
              )}
            </div>

            <DatabaseSyncForm values={values} setFieldValue={setFieldValue} />

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary"
                data-testid="settings-submit"
              >
                <Translate value="labels.save" />
              </button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  )
}
