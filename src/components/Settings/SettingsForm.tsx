import { Dispatch } from 'redux'
import { Formik, Form } from 'formik'
import { Translate } from 'react-redux-i18n'
import * as React from 'react'
import classNames from 'classnames'

import { State as SettingsStateType } from '../../reducers/settings'
import Button from '../common/Button'
import FormSchema from './FormSchema'
import * as types from '../../constants/ActionTypes'

type Props = {
  settings: SettingsStateType,
  dispatch: Dispatch,
  schema: any
}

export const settingsCard = classNames({
  'relative': true,
  'bg-gray-900': true,
  'p-10': true,
  'mb-4': true,
  'rounded-lg': true
})

const SettingsForm = (props: Props) => {
  const saveSettings = (form: any): any => {
    props.dispatch({type: types.SAVE_SETTINGS, settingsPayload: form})
  }

  const { settings } = props

  return (
    <Formik
      initialValues={settings.settings}
      onSubmit={(values, actions) => {
        saveSettings(values)
        actions.setSubmitting(false)
      }}
      enableReinitialize
      render=
        {({
          isSubmitting
        }) => (
          <Form
            className='settings-form'
          >
            <h2 className='text-2xl py-3'><Translate value="labels.generalSettings" /></h2>

            <div className={settingsCard}>
              <FormSchema schema={props.schema} />
            </div>

            <div>
              <Button long fullWidth uppercase disabled={isSubmitting} type='submit'>
                <Translate value="buttons.save" />
              </Button>
            </div>
          </Form>
        )}
    />
  )
}

export default SettingsForm
