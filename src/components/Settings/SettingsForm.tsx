import * as React from 'react'
import { Formik, Form } from 'formik'
import { Dispatch } from 'redux'
import { Route } from 'react-router-dom'
import { Link } from 'react-router-dom'
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

const SettingsForm = (props: Props) => {
  const saveSettings = (form: any): any => {
    props.dispatch({type: types.SAVE_SETTINGS, settingsPayload: form})
  }

  const providers = Object.keys(props.settings.settingsForm.providers).map((providerKey) => {
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
      <div key={providerKey} className='card provider-card'>
        <div className='card-body'>
          <FormSchema schema={props.settings.settingsForm.providers[providerKey]} />
        </div>

        <div className='card-footer'>
          <RemoveProviderBtn
            providerKey={providerKey}
            dispatch={props.dispatch}
          />
        </div>
      </div>
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
              <FormSchema schema={props.schema} />
            </div>

            <h2><Translate value="labels.providers" /></h2>

            <div className='btn-group provider-buttons'>
              <ProviderButton providerKey='subsonic' />
              <ProviderButton providerKey='mstream' />
              <ProviderButton providerKey='itunes' />
            </div>

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
