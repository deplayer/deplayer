import { Dispatch } from 'redux'

import { State as SettingsStateType } from '../../reducers/settings'
import Button from '../common/Button'
import Icon from '../common/Icon'
import FormSchema from './FormSchema'
import * as types from '../../constants/ActionTypes'
import { settingsCard } from './SettingsForm'
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
        size='lg'
        className='hover:text-error'
        onClick={onClick}
        title={props.providerKey}
      >
        <Icon icon='faTrash' />
      </Button>
    )
  }

  // Get all instances of this provider type from the actual settings
  const providerInstances = Object.keys(props.settings.settings.providers)
    .filter(key => key.startsWith(props.providerKey))

  // Only render forms for providers that exist in both settings and form schema
  const validInstances = providerInstances.filter(
    key => props.settings.settingsForm.providers[key]
  )

  return (
    <>
      {validInstances.map(instanceKey => (
        <div key={instanceKey} className={`${settingsCard} w-full`}>
          <div className='top-2 right-2 absolute'>
            <RemoveProviderBtn
              providerKey={instanceKey}
              dispatch={props.dispatch}
            />
          </div>

          <FormSchema 
            providerKey={instanceKey} 
            schema={props.settings.settingsForm.providers[instanceKey]} 
          />
        </div>
      ))}
    </>
  )
}

export default ProviderForm
