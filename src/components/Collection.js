// @flow

import React, { Component } from 'react';
import { Dispatch } from 'redux'

import MusicTable from './MusicTable'

import { getCollection } from '../actions/collection';

type Props = {
  data: any,
  page: number,
  offset: number,
  pages: number,
  total: number,
  dispatch: Dispatch,
}

class Collection extends Component<Props> {
  componentWillMount () {
    const { dispatch } = this.props
    dispatch(getCollection())
  }

  render() {
    return (
      <div className='collection'>
        <MusicTable {...this.props} />
      </div>
    )
  }
}

export default Collection
