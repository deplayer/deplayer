import * as React from 'react'
import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'

const ProviderForm = () => {
  return (
    <div>
      <h2>Provider form</h2>

      <Link
        className='btn btn-secondary'
        to="/settings"
        title="settings"
      >
        <i className='fa fa-back'></i>
        <Translate value="buttons.returnToSettings" />
      </Link>
    </div>
  )
}

export default ProviderForm
