import * as React from 'react'
import { Dispatch } from 'redux'
import { State as SettingsStateType } from '../../reducers/settings'
import * as types from '../../constants/ActionTypes'
import FormSchema from './FormSchema'

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

export default ProviderForm
