// @flow

import React from 'react'
import { Form, Button } from 'semantic-ui-react'
import { Translate }  from 'react-redux-i18n'
import { Formik, Field } from 'formik'
import { Dispatch } from 'redux'

import { SAVE_SETTINGS } from '../../constants/ActionTypes'
import { defaultState } from '../../reducers/settings'

type Props = {
  settings: any,
  dispatch: Dispatch
}

const SettingsForm = (props: Props) => {
  const saveSettings = (form: any): any => {
    props.dispatch({type: SAVE_SETTINGS, settingsPayload: form})
  }

  const { settings } = props
  return (
    <Formik
      initialValues={defaultState.settings}
      values={settings.settings}
      onSubmit={(values, actions) => {
        saveSettings(values)
        actions.setSubmitting(false)
      }}
      isSubmitting={settings.saving}
    >
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
          onSubmit={handleSubmit}
        >
          <label><Translate value="labels.enabled" /></label>
          <Field
            type='checkbox'
            name='providers.mstream.enabled'
          />
          <label><Translate value="labels.mstream.baseUrl" /></label>
          <Field
            type='text'
            name='providers.mstream.baseUrl'
            placeholder='http://my-mstream-server.me'
          />
          <Button disabled={isSubmitting} type='submit'>
            <Translate value="buttons.mstream.save" />
          </Button>
        </Form>
      )}
    </Formik>
  )
}

export default SettingsForm
