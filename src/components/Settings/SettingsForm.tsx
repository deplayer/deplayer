import * as React from 'react'
import { Formik, Form } from 'formik'
import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import ProviderButton from './ProviderButton'

import * as types from '../../constants/ActionTypes'
import FormSchema from './FormSchema'
import { State as SettingsStateType } from '../../reducers/settings'

type Props = {
  settings: SettingsStateType,
  dispatch: Dispatch,
  schema: any
}

type ProviderFormProps = {
  providerKey: string,
  settings: SettingsStateType,
  dispatch: Dispatch
}

const ProviderForm = (props: ProviderFormProps) => {
  const RemoveProviderBtn = (props: any) => {
    const onClick = () => {
      props.dispatch({type: types.REMOVE_PROVIDER, providerKey: props.providerKey})
    }
    return (
      <div className='float-right'>
        <a
          className='btn btn-secondary'
          onClick={onClick}
          title={ props.providerKey }
        >
          <i className='fa fa-remove'></i>
        </a>
      </div>
    )
  }
  return (
    <div key={props.providerKey} className='card provider-card'>
      <div className='card-body'>
        <FormSchema schema={props.settings.settingsForm.providers[props.providerKey]} />
      </div>

      <div className='card-footer'>
        <RemoveProviderBtn
          providerKey={props.providerKey}
          dispatch={props.dispatch}
        />
      </div>
    </div>
  )
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

            <h2><Translate value="labels.metadataProviders" /></h2>

            <div className='btn-group provider-buttons'>
              <ProviderButton providerKey='lastfm' />
            </div>

            <button className='with-bg' disabled={isSubmitting} type='submit'>
              <Translate value="buttons.save" />
            </button>
          </Form>
        )}
    />
  )
}

export default SettingsForm
