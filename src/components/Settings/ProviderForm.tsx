import { Dispatch } from 'redux'
import classNames from 'classnames'

import { State as SettingsStateType } from '../../reducers/settings'
import Button from '../common/Button'
import Icon from '../common/Icon'
import FormSchema from './FormSchema'
import * as types from '../../constants/ActionTypes'

const settingsCard = classNames(
  'card',
  'bg-base-600',
  'shadow-xl',
  'p-6',
  'relative',
  'bg-base-200',
  'p-8',
  'mb-6',
  'rounded-lg',
  'shadow-sm'
)

type ProviderFormProps = {
  providerKey: string,
  settings: SettingsStateType,
  dispatch: Dispatch
}

interface RemoveProviderBtnProps {
  providerKey: string;
  dispatch: Dispatch;
}

const ProviderForm = (props: ProviderFormProps) => {
  const RemoveProviderBtn = ({ providerKey, dispatch }: RemoveProviderBtnProps) => {
    const onClick = () => {
      dispatch({ type: types.REMOVE_PROVIDER, providerKey })
    }

    return (
      <Button
        transparent
        size='lg'
        className='hover:text-error'
        onClick={onClick}
        title={providerKey}
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
