import React, { Component } from 'react';

import { getCollection } from '../actions/collection';
import ReactTable from "react-table";
import 'react-table/react-table.css'

export default class Collection extends Component {
  componentWillMount () {
    const { dispatch } = this.props
    dispatch(getCollection())
  }

  render() {
    const columns = [
      {
        Header: 'Artist',
        accessor: 'doc.artist' // String-based value accessors!
      },
      {
        Header: 'Title',
        accessor: 'doc.title' // String-based value accessors!
      },
      {
        Header: 'Length',
        accessor: 'doc.length' // String-based value accessors!
      },
    ]

    return (
      <div>
        <ReactTable
          data={this.props.collection.rows}
          columns={columns}
          defaultSorted={[
            {
              id: 'doc.artist',
              desc: false
            }
          ]}
        />
        Total songs {this.props.collection.totalRows}
      </div>
    )
  }
}
