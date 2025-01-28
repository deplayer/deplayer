import { Dispatch } from 'redux'
import { Formik, Form } from 'formik'
import { Translate } from 'react-redux-i18n'

import * as types from '../../constants/ActionTypes'
import { State as SettingsStateType } from '../../reducers/settings'
import Button from '../common/Button'
import MainContainer from '../common/MainContainer'
import ProviderButton from './ProviderButton'
import ProviderForm from '../Settings/ProviderForm'
import CenteredMessage from '../common/CenteredMessage'
import { settingsButton } from '../Settings/SettingsForm'

type Props = {
  settings: SettingsStateType,
  dispatch: Dispatch
}

const Providers = (props: Props) => {
  const handleSubmit = (values: any, actions: any) => {
    props.dispatch({ type: types.SAVE_SETTINGS, settingsPayload: values })
    actions.setSubmitting(false)
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
      <CenteredMessage>
        <div className='md:px-20'>
          <div className='my-3 flex flex-col'>
            <h2 className='py-4 text-xl'><Translate value="labels.lazyProviders" /></h2>

            Select one of the providers below to configure it.

            <div className='flex pt-2'>
              <ProviderButton providerKey='subsonic' />
              <ProviderButton providerKey='mstream' />
              <ProviderButton providerKey='itunes' />
              <ProviderButton providerKey='jellyfin' />
              <ProviderButton providerKey='musicbrainz' />
            </div>
          </div>

          <Formik
            initialValues={props.settings.settings}
            onSubmit={handleSubmit}
            enableReinitialize
          >{({ isSubmitting }) => (
            <Form
              className='settings-form'
            >
              <div className='flex flex-wrap'>
                {providers}
              </div>

              <div className='w-full flex justify-end mt-12'>
                {!!providers.length && (
                  <div className='max-w-xs'>
                    <Button
                      {...settingsButton}
                      disabled={isSubmitting}
                      type='submit'
                    >
                      <Translate value="buttons.save" />
                    </Button>
                  </div>
                )}
              </div>
            </Form>)}
          </Formik>
        </div>
      </CenteredMessage>
    </MainContainer>
  )
}

export default Providers
