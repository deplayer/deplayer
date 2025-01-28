import { Dispatch } from 'redux'
import { Formik, Form } from 'formik'
import { Translate } from 'react-redux-i18n'
import classNames from 'classnames'

import { State as SettingsStateType } from '../../reducers/settings'
import Button from '../common/Button'
import FormSchema from './FormSchema'
import * as types from '../../constants/ActionTypes'
import { FormField } from '../../types/forms'

type Props = {
  settings: SettingsStateType,
  dispatch: Dispatch,
  schema: { fields: FormField[] }
}

export const settingsCard = classNames({
  'relative': true,
  'bg-base-200': true,
  'p-10': true,
  'mb-4': true,
  'rounded-lg': true
})

export const settingsButton = {
  fullWidth: true,
  size: '2xl' as const,
  className: 'btn-primary'
}

export const settingsButtonContainer = classNames({
  'w-full': true,
  'flex': true,
  'justify-center': true,
  'mt-12': true,
  'max-w-xs': true
})

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
        isSubmitting
      }) => (
        <Form
          className='settings-form'
        >
          <h2 className='text-2xl py-3 text-base-content'><Translate value="labels.generalSettings" /></h2>

          <div className={settingsCard}>
            <FormSchema schema={schema} />

            <div className='w-full flex justify-center mt-12'>
              <div className={settingsButtonContainer}>
                <Button
                  {...settingsButton}
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
