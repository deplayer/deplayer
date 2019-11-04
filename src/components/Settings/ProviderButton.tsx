import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import { connect } from 'react-redux'
import * as React from 'react'

import Button from '../common/Button'
import * as types from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch,
  providerKey: string
}

const ProviderButton = (props: Props) => {
  const onClick = () => {
    props.dispatch({type: types.ADD_PROVIDER, providerKey: props.providerKey})
  }

  return (
    <Button
      inverted
      className='btn btn-secondary'
      onClick={onClick}
      title={ props.providerKey }
    >
      <i className='fa fa-plus'></i>
      <Translate value={`buttons.addProvider.${props.providerKey}`} />
    </Button>
  )
}

export default connect()(ProviderButton)
