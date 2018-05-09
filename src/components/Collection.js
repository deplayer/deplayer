import React, { Component } from 'react';
import PropTypes from 'prop-types'

import { getCollection } from '../actions/collection';
import { setCurrentPlaying } from '../actions/playlist'
import ReactTable from "react-table";
import 'react-table/react-table.css'

class Collection extends Component {
  componentWillMount () {
    const { dispatch } = this.props
    dispatch(getCollection())
  }

  play(song) {
    this.props.dispatch(setCurrentPlaying(song))
  }

  render() {
    const columns = [
      {
        Header: 'Artist',
        accessor: 'artist'
      },
      {
        Header: 'Title',
        accessor: 'title'
      },
      {
        Header: 'Length',
        accessor: 'length'
      },
      {
        Header: 'Actions',
        id: 'actions',
        accessor: (item) => {
          return <button className='btn' onClick={(song) => this.play(item)}>Play</button>
        }
      }
    ]

    return (
      <div className='collection'>
        <ReactTable
          data={this.props.data}
          columns={columns}
          defaultSorted={[
            {
              id: 'artist',
              desc: false
            }
          ]}
        />
        Total songs {this.props.total}
      </div>
    )
  }
}

Collection.propTypes = {
  data: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  pages: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  dispatch: PropTypes.func.isRequired
}

export default Collection
