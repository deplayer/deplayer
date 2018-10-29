// @flow

import React from 'react';

import { Link } from 'react-router-dom'

const CollectionButton = (props: any) => {
  return (
    <div className='button'>
      <Link
        to="/collection"
        title="collection"
      >
        <i className='icon database outline'></i>
      </Link>
    </div>
  )
}

export default CollectionButton
