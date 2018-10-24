// @flow

import React from 'react';

import { Link } from 'react-router-dom'

const SettingsButton = (props: any) => {
  return (
    <div className='settings-button button'>
      <Link to="/settings">
        <i className='icon cogs outline'></i>
      </Link>
    </div>
  )
}

export default SettingsButton
