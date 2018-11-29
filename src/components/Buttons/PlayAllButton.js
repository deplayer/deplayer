// @flow

import React from 'react';

import { Link } from 'react-router-dom'

const PlayAllButton = (props: any) => {
  return (
    <div className='playall-button button'>
      <Link to="/settings">
        <i className='fa fa-caret-right'></i>
      </Link>
    </div>
  )
}

export default PlayAllButton
