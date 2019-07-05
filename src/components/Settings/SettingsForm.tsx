import * as React from 'react'
import { Formik, Form } from 'formik'
import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import ProviderButton from './ProviderButton'

import * as types from '../../constants/ActionTypes'
import FormSchema from './FormSchema'
import { State as SettingsStateType } from '../../reducers/settings'
import ProviderForm from './ProviderForm'

type Props = {
  settings: SettingsStateType,
  dispatch: Dispatch,
  schema: any
}

const SettingsForm = (props: Props) => {
  const saveSettings = (form: any): any => {
    props.dispatch({type: types.SAVE_SETTINGS, settingsPayload: form})
  }

  const providers = Object.keys(props.settings.settingsForm.providers).map((providerKey) => {
    return (
      <ProviderForm
        settings={props.settings}
        dispatch={props.dispatch}
        providerKey={providerKey}
      />
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
            <h2><Translate value="labels.generalSettings" /></h2>

            <div className='card app-settings'>
              <div className='card-body'>
                <FormSchema schema={props.schema} />
              </div>
            </div>

            <h2><Translate value="labels.providers" /></h2>

            <div className='btn-group provider-buttons'>
              <ProviderButton providerKey='subsonic' />
              <ProviderButton providerKey='mstream' />
              <ProviderButton providerKey='itunes' />
            </div>

            { providers }

            <div>
              <button className='with-bg' disabled={isSubmitting} type='submit'>
                <Translate value="buttons.save" />
              </button>
            </div>
          </Form>
        )}
    />
  )
}

export default SettingsForm
