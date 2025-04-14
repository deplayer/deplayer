import { Dispatch } from 'redux'
import { Formik, Form } from 'formik'
import { I18n, Translate } from 'react-redux-i18n'
import classNames from 'classnames'

import { State as SettingsStateType } from '../../reducers/settings'
import FormSchema from './FormSchema'
import * as types from '../../constants/ActionTypes'
import { FormField } from '../../types/forms'
import LanguageDetector from '../../services/language/LanguageDetector'
import DatabaseSyncForm from './DatabaseSyncForm'

type Props = {
  settings: SettingsStateType,
  dispatch: Dispatch,
  schema: { fields: FormField[] }
}

const formControlClass = classNames(
  'form-control',
  'w-full',
  'mb-6',
  'last:mb-0'
)

export const settingsCard = classNames(
  'card',
  'bg-base-600',
  'shadow-xl',
  'p-6',
  'relative',
  'bg-base-200',
  'p-8',
  'mb-6',
  'rounded-lg',
  'shadow-sm'
)

const settingsButton = classNames(
  'card-title',
  'text-xl',
  'font-bold'
)

const labelClass = classNames(
  'w-full',
  'label',
  'cursor-pointer',
  'justify-between',
  'gap-4',
  'py-2'
)

const labelTextClass = classNames(
  'label-text',
  'flex-1',
  'leading-relaxed',
  'text-base-content'
)

const selectClass = classNames(
  'select',
  'select-bordered',
  'w-full',
  'bg-base-100'
)

const AVAILABLE_LANGUAGES = [
  { code: 'en', label: 'languages.english' },
  { code: 'ca', label: 'languages.catalan' },
  { code: 'es', label: 'languages.spanish' }
] as const

const SettingsForm = (props: Props) => {
  const handleSubmit = (values: any, actions: any) => {
    props.dispatch({ type: types.SAVE_SETTINGS, settingsPayload: values })
    actions.setSubmitting(false)
  }

  const { settings, schema } = props

  return (
    <div className={settingsCard}>
      <div className={settingsCard}>
        <DatabaseSyncForm />
      </div>

      <Formik
        initialValues={settings.settings}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({
          values,
          setFieldValue
        }) => (
          <>
              <label className={labelClass}>
                <Translate value="labels.useSystemLanguage" />
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={values.app?.language?.useSystemLanguage ?? true}
                    onChange={(e) => {
                      setFieldValue('app.language', {
                        ...values.app?.language,
                        useSystemLanguage: e.target.checked,
                        code: e.target.checked ? LanguageDetector.getPreferredLanguage() : (values.app?.language?.code ?? 'en')
                      })
                    }}
                  />
                </div>
              </label>

              {!(values.app?.language?.useSystemLanguage ?? true) && (
                <div className={formControlClass}>
                  <label className={labelClass}>
                    <span className={labelTextClass}>
                      <Translate value="labels.selectLanguage" />
                    </span>
                  </label>
                  <select
                    className={selectClass}
                    value={values.app?.language?.code ?? 'en'}
                    onChange={(e) => setFieldValue('app.language', {
                      ...values.app?.language,
                      code: e.target.value
                    })}
                  >
                    {AVAILABLE_LANGUAGES.map(({ code, label }) => (
                      <option key={code} value={code}>
                        {I18n.t(label)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            <Form>
              <div className={settingsCard}>
                <FormSchema schema={schema} />
              </div>

              <div className='w-full flex justify-end mt-12'>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  data-testid="settings-submit"
                >
                  <Translate value="buttons.saveSettings" /> 
                </button>
              </div>
            </Form>
          </>
        )}
      </Formik>
    </div>
  )
}

export default SettingsForm
