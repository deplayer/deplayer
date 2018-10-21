// @flow

import React from 'react'
import { Form, Button } from 'semantic-ui-react'
import { Translate }  from 'react-redux-i18n'
import { Formik } from 'formik'

type Props = {
  onSubmit: () => Promise<any>
}

const SettingsForm = (props: Props) => {
  const initialValues = {
    mstream: {
      baseUrl: ''
    }
  }
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={props.onSubmit}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        isSubmitting,
        /* and other goodies */
      }) => (
        <Form
          className='settings-form'
          onSubmit={handleSubmit}
        >
          <Form.Field>
            <label><Translate value="labels.mstream.baseUrl" /></label>
            <Form.Input
              fluid
              type='text'
              name='mstream.baseUrl'
              onChange={handleChange}
              placeholder='http://my-mstream-server.me'
              value={values.mstream.baseUrl}
            />
          </Form.Field>
          <Button disabled={isSubmitting} type='submit'><Translate value="buttons.mstream.save" /></Button>
        </Form>
      )}
    </Formik>
  )
}

export default SettingsForm
