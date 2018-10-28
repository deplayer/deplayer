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
  dispatch: Dispatch,
  schema: any
}

const SettingsForm = (props: Props) => {
  const saveSettings = (form: any): any => {
    props.dispatch({type: SAVE_SETTINGS, settingsPayload: form})
  }

  // Convert schema object to form elements
  const populateFromSchema = (schema) => {
    const { fields } = props.schema

    const populatedFields = fields.map((field) => {
      return (
        <div
          key={field.name}
          className='form-group'
        >
          { field.type !== 'checkbox' ?
              <label>{field.title}</label> : null }
          <Field
            name={field.name}
            type={field.type}
          />
          { field.type === 'checkbox' ?
              <label>{field.title}</label> : null }
        </div>
      )
    })

    return populatedFields
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
          { populateFromSchema(props.schema) }
          <Button disabled={isSubmitting} type='submit'>
            <Translate value="buttons.mstream.save" />
          </Button>
        </Form>
      )}
    </Formik>
  )
}

export default SettingsForm
