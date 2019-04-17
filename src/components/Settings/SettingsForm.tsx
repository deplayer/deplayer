import * as React from 'react'
import { Formik, Form } from 'formik'
import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'

import * as types from '../../constants/ActionTypes'
import FormSchema from './FormSchema'

type Props = {
  settings: any,
  dispatch: Dispatch,
  schema: any
}

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
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting
        }) => (
          <Form
            className='settings-form'
          >
            <FormSchema schema={props.schema} />
            <button className='with-bg' disabled={isSubmitting} type='submit'>
              <Translate value="buttons.save" />
            </button>
          </Form>
        )}
    />
  )
}

export default SettingsForm
