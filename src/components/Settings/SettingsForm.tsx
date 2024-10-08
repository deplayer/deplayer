import { Dispatch } from 'redux'
import { Formik, Form } from 'formik'
import { Translate } from 'react-redux-i18n'
import classNames from 'classnames'

import { State as SettingsStateType } from '../../reducers/settings'
import Button from '../common/Button'
import FormSchema from './FormSchema'
import * as types from '../../constants/ActionTypes'

type Props = {
  settings: SettingsStateType,
  dispatch: Dispatch,
  schema: { fields: any[] }
}

export const settingsCard = classNames({
  'relative': true,
  'dark:bg-gray-900': true,
  'bg-gray-200': true,
  'p-10': true,
  'mb-4': true,
  'rounded-lg': true
})

const SettingsForm = (props: Props) => {
  const saveSettings = (form: any): any => {
    props.dispatch({ type: types.SAVE_SETTINGS, settingsPayload: form })
  }

  const { settings, schema } = props

  return (
    <Formik
      initialValues={settings.settings}
      onSubmit={(values, actions) => {
        saveSettings(values)
        actions.setSubmitting(false)
      }}
      enableReinitialize
    >
      {({
        isSubmitting
      }) => (
        <Form
          className='settings-form'
        >
          <h2 className='text-2xl py-3'><Translate value="labels.generalSettings" /></h2>

          <div className={settingsCard}>
            <FormSchema schema={schema} />

            <div className='w-full flex justify-center mt-12'>
              <div className='max-w-xs w-full'>
                <Button
                  long
                  fullWidth
                  uppercase
                  size='2xl'
                  disabled={isSubmitting}
                  type='submit'
                >
                  <Translate value="buttons.save" />
                </Button>
              </div>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  )
}

export default SettingsForm
