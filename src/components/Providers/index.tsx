import { Dispatch } from 'redux'
import { Formik, Form } from 'formik'
import { Translate } from 'react-redux-i18n'

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
    props.dispatch({ type: types.SAVE_SETTINGS, settingsPayload: form })
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
    <MainContainer centerContents>
      <div className='md:px-20'>
        <div className='my-3 flex flex-col'>
          <h2 className='py-4 text-xl'><Translate value="labels.lazyProviders" /></h2>

          Select one of the providers below to configure it.

          <div className='flex pt-2'>
            <ProviderButton providerKey='subsonic' />
            <ProviderButton providerKey='mstream' />
            <ProviderButton providerKey='itunes' />
            <ProviderButton providerKey='jellyfin' />
          </div>
        </div>

        <Formik
          initialValues={props.settings.settings}
          onSubmit={(values, actions) => {
            saveSettings(values)
            actions.setSubmitting(false)
          }}
          enableReinitialize
        >{({ isSubmitting }) => (
          <Form
            className='settings-form'
          >

            <div className='flex flex-wrap'>
              {providers}
            </div>

            <div className='right-0 pb-20 pr-10 flex justify-end'>
              {!!providers.length && (
                <Button long uppercase disabled={isSubmitting} type='submit' size='2xl' >
                  <Translate value="buttons.save" />
                </Button>
              )}
            </div>
          </Form>)}
        </Formik>
      </div>
    </MainContainer>
  )
}

export default Providers
