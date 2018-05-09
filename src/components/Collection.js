import React, { Component } from 'react';
import PropTypes from 'prop-types'
import MusicTable from './MusicTable'

import { getCollection } from '../actions/collection';

class Collection extends Component {
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

Collection.propTypes = {
  data: PropTypes.object.isRequired,
  page: PropTypes.number.isRequired,
  offset: PropTypes.number.isRequired,
  pages: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  dispatch: PropTypes.func.isRequired
}

export default Collection
