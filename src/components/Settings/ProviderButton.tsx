import * as React from 'react'
import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'

type Props = {
  providerKey: string
}

const ProviderButton = (props: Props) => {
  return (
    <Link
      className='btn btn-secondary'
      to={`/settings/providers/${props.providerKey}`}
      title={ props.providerKey }
    >
      <i className='fa fa-plus'></i>
      <Translate value={`buttons.addProvider.${props.providerKey}`} />
    </Link>
  )
}

export default ProviderButton
