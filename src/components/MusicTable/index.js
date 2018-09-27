// @flow

import React, { Component } from 'react'
import ReactTable from "react-table"
import { Dispatch } from 'redux'

import { setCurrentPlaying, addToPlaylist } from '../../actions/playlist'
import SearchBar from '../SearchBar/SearchBar'
import 'react-table/react-table.css'

type Props = {
  data: Array<any>,
  page: number,
  offset: number,
  pages: number,
  total: number,
  dispatch: Dispatch,
}

class MusicTable extends Component<Props> {
  onAddToPlaylistClick(song: any) {
    this.props.dispatch(addToPlaylist(song))
  }

  play(song: any) {
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
          return (
            <div>
              <button className='btn' onClick={(song) => this.play(item)}>Play</button>
              <button className='btn' onClick={(song) => this.onAddToPlaylistClick(item)}>Add to playlist</button>
            </div>
          )
        }
      }
    ]

    return (
      <div className='music-table'>
        <SearchBar />
        <ReactTable
          data={Object.values(this.props.data)}
          columns={columns}
          page={this.props.page}
          pageSize={this.props.offset}
          defaultSorted={[
            {
              id: 'artist',
              desc: false
            }
          ]}
          className="-striped -highlight"
        />
        Total songs {this.props.total}
      </div>
    )
  }
}

export default MusicTable
