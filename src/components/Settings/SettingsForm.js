// @flow

import React from 'react'
import { Form, Button } from 'semantic-ui-react'
import { Translate }  from 'react-redux-i18n'
import { Formik, Field } from 'formik'

import { defaultState } from '../../reducers/settings'

type Props = {
  onSubmit: () => Promise<any>,
  settings: any
}

const SettingsForm = (props: Props) => {
  const { settings } = props
  return (
    <Formik
      initialValues={defaultState.settings}
      values={settings.settings}
      onSubmit={props.onSubmit}
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
