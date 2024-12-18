import { Dispatch } from 'redux'

import { State as SettingsStateType } from '../../reducers/settings'
import { settingsCard } from './SettingsForm'
import Button from '../common/Button'
import Icon from '../common/Icon'
import FormSchema from './FormSchema'
import * as types from '../../constants/ActionTypes'

type ProviderFormProps = {
  providerKey: string,
  settings: SettingsStateType,
  dispatch: Dispatch
}

const ProviderForm = (props: ProviderFormProps) => {
  const RemoveProviderBtn = (props: any) => {
    const onClick = () => {
      props.dispatch({ type: types.REMOVE_PROVIDER, providerKey: props.providerKey })
    }

    return (
      <Button
        transparent
        onClick={onClick}
        title={props.providerKey}
      >
        <Icon icon='faTrash' />
      </Button>
    )
  }

  return (
    <div key={props.providerKey} className={`${settingsCard} w-full`}>
      <div className='top-0 right-0 absolute'>
        <RemoveProviderBtn
          providerKey={props.providerKey}
          dispatch={props.dispatch}
        />
      </div>

      <FormSchema providerKey={props.providerKey} schema={props.settings.settingsForm.providers[props.providerKey]} />
    </div>
  )
}

export default ProviderForm
