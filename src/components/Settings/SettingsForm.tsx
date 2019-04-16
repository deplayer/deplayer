import * as React from 'react'
import { Formik, Form } from 'formik'
import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'

import FormField, { TYPES } from './FormField'
import * as types from '../../constants/ActionTypes'

type Props = {
  settings: any,
  dispatch: Dispatch,
  schema: any
}

const SettingsForm = (props: Props) => {
  const saveSettings = (form: any): any => {
    props.dispatch({type: types.SAVE_SETTINGS, settingsPayload: form})
  }

  // Convert schema object to form elements
  const populateFromSchema = (schema) => {
    console.log(props.schema)

    const { fields } = props.schema

    const populatedFields = fields.map((field, index) => {
      if (field.type === TYPES.title) {
        return <h2 key={index}><Translate value={field.title} /></h2>
      }

      return (
        <div
          key={field.name}
          className="form-group row"
        >
          <label className='col-sm-2 col-form-label'>
            <Translate value={field.title} />
          </label>
          <div className='col-sm-10'>
            <FormField
              field={field}
            />
          </div>
        </div>
      )
    })

    return populatedFields
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
            { populateFromSchema(props.schema) }
            <button className='with-bg' disabled={isSubmitting} type='submit'>
              <Translate value="buttons.save" />
            </button>
          </Form>
        )}
    />
  )
}

export default SettingsForm
