import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import { connect } from 'react-redux'

import Icon from '../common/Icon'
import Button from '../common/Button'
import * as types from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch,
  providerKey: string
}

const ProviderButton = (props: Props) => {
  const onClick = () => {
    // Dispatch to Redux to update the local state/form
    props.dispatch({ type: types.ADD_PROVIDER, providerKey: props.providerKey })
    
    // Note: The actual save to LiveStore happens when user clicks "Save Settings" button
    // in the Providers form. This just adds the provider to the local form state.
  }

  return (
    <Button
      inverted
      onClick={onClick}
      title={props.providerKey}
    >
      <Icon icon='faPlusCircle' className='mr-2' />
      <Translate value={`buttons.addProvider.${props.providerKey}`} />
    </Button>
  )
}

export default connect()(ProviderButton)
