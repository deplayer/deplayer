import { Dispatch } from 'redux'
import { Formik, Form } from 'formik'
import { Translate } from 'react-redux-i18n'
import classNames from 'classnames'

import { State as SettingsStateType } from '../../reducers/settings'
import Button from '../common/Button'
import FormSchema from './FormSchema'
import * as types from '../../constants/ActionTypes'
import { FormField } from '../../types/forms'
import LanguageDetector from '../../services/language/LanguageDetector'

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
    <Formik
      initialValues={settings.settings}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({
        isSubmitting,
        values,
        setFieldValue
      }) => (
        <Form>
          <SettingsFormGroup
            title="labels.language"
            showSubmitButton={false}
          >
            <label className={labelClass}>
              <span className={labelTextClass}>
                <Translate value="labels.useSystemLanguage" />
              </span>
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
          </SettingsFormGroup>

          <SettingsFormGroup
            title="labels.otherSettings"
            isSubmitting={isSubmitting}
          >
            <FormSchema schema={schema} />
          </SettingsFormGroup>
        </Form>
      )}
    </Formik>
  )
}

export default SettingsForm
