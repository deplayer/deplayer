import { Dispatch } from 'redux'
import { Formik, Form } from 'formik'
import { Translate } from 'react-redux-i18n'
import React from 'react'

import * as types from '../../constants/ActionTypes'
import { State as SettingsStateType } from '../../reducers/settings'
import Button from '../common/Button'
import MainContainer from '../common/MainContainer'
import ProviderButton from './ProviderButton'
import ProviderForm from '../Settings/ProviderForm'

type Props = {
  settings: SettingsStateType,
  dispatch: Dispatch
}

const Providers = (props: Props) => {
  const saveSettings = (form: any): any => {
    props.dispatch({type: types.SAVE_SETTINGS, settingsPayload: form})
  }

  const providers = Object.keys(props.settings.settingsForm.providers).map((providerKey) => {
    return (
      <ProviderForm
        key={providerKey}
        settings={props.settings}
        dispatch={props.dispatch}
        providerKey={providerKey}
      />
    )
  })

  return (
    <MainContainer>
      <h2><Translate value="labels.providers" /></h2>

      <div className='my-3'>
        <ProviderButton providerKey='subsonic' />
        <ProviderButton providerKey='mstream' />
        <ProviderButton providerKey='itunes' />
        <ProviderButton providerKey='ipfs' />
        <ProviderButton providerKey='youtube-dl-server' />
      </div>

      <Formik
        initialValues={props.settings.settings}
        onSubmit={(values, actions) => {
          saveSettings(values)
          actions.setSubmitting(false)
        }}
        enableReinitialize
        render=
          {({
            isSubmitting
          }) => (
            <Form
              className='settings-form'
            >

              { providers }

              <div>
                <Button long disabled={isSubmitting} type='submit'>
                  <Translate value="buttons.save" />
                </Button>
              </div>
            </Form>
          )}
      />
    </MainContainer>
  )
}

export default Providers
