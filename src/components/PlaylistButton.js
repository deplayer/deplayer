// @flow

import React from 'react';

import { Link } from 'react-router-dom'

const PlaylistButton = (props: any) => {
  return (
    <div className='button'>
      <Link
        to="/"
        title="playlists"
      >
        <i className='icon music outline'></i>
      </Link>
    </div>
  )
}

export default PlaylistButton
