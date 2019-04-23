import * as React from 'react'
import { Formik, Form } from 'formik'
import { Dispatch } from 'redux'
import { Route } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'

import * as types from '../../constants/ActionTypes'
import FormSchema from './FormSchema'
import { State as SettingsStateType } from '../../reducers/settings'

type Props = {
  settings: SettingsStateType,
  dispatch: Dispatch,
  schema: any
}

const SettingsForm = (props: Props) => {
  const saveSettings = (form: any): any => {
    props.dispatch({type: types.SAVE_SETTINGS, settingsPayload: form})
  }

  console.log('providers received by form: ', props.settings.settingsForm.providers)
  const providers = Object.keys(props.settings.settingsForm.providers).map((providerKey) => {
    return (
      <FormSchema key={providerKey} schema={props.settings.settingsForm.providers[providerKey]} />
    )
  })

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
            { providers }

            <Route path="/settings/providers" component={() =>
              <Link
                className='btn btn-secondary'
                to="/settings"
                title="settings"
              >
                <i className='fa fa-back'></i>
                <Translate value="buttons.returnToSettings" />
              </Link>
            } />

            <button className='with-bg' disabled={isSubmitting} type='submit'>
              <Translate value="buttons.save" />
            </button>
          </Form>
        )}
    />
  )
}

export default SettingsForm
