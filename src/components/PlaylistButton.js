// @flow

import React from 'react';

import { Link } from 'react-router-dom'

const PlaylistButton = (props: any) => {
  return (
    <Link className='button' to="/">
      <i className='icon folder outline'></i>
    </Link>
  )
}

export default PlaylistButton
