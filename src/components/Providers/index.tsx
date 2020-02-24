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

  const scanSources = () => {
    props.dispatch({type: types.START_SCAN_SOURCES})
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
      <div className='md:px-20'>
        <div className='my-3'>
          <h2 className='py-4'><Translate value="labels.lazyProviders" /></h2>
          <ProviderButton providerKey='subsonic' />
          <ProviderButton providerKey='mstream' />
          <ProviderButton providerKey='itunes' />

          <h2 className='py-4'><Translate value="labels.oneOffProviders" /></h2>
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

                <div className='flex flex-wrap'>
                  { providers }
                </div>

                <div>
                  <Button long disabled={isSubmitting} type='submit'>
                    <Translate value="buttons.save" />
                  </Button>
                </div>
              </Form>
            )}
        />
        <div className='my-12'>
          <Button onClick={scanSources} inverted>
            <Translate value="labels.scanSources" />
          </Button>
        </div>
      </div>
    </MainContainer>
  )
}

export default Providers
