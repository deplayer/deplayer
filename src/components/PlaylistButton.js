// @flow

import React from 'react';

import { Link } from 'react-router-dom'

const PlaylistButton = (props: any) => {
  return (
    <div className='button'>
      <Link to="/">
        <i className='icon folder outline'></i>
      </Link>
    </div>
  )
}

export default PlaylistButton
