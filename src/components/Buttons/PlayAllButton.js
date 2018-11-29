// @flow

import React from 'react';

import { Link } from 'react-router-dom'

const SettingsButton = (props: any) => {
  return (
    <div className='playall-button button'>
      <Link to="/settings">
        <i className='fa fa-play'></i>
      </Link>
    </div>
  )
}

export default SettingsButton
