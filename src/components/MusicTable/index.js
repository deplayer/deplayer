import React, { Component } from 'react';
import PropTypes from 'prop-types'

import { setCurrentPlaying, addToPlaylist } from '../../actions/playlist'
import ReactTable from "react-table";
import 'react-table/react-table.css'

class MusicTable extends Component {
  onAddToPlaylistClick(song) {
    this.props.dispatch(addToPlaylist(song))
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

MusicTable.propTypes = {
  data: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  offset: PropTypes.number.isRequired,
  pages: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  dispatch: PropTypes.func.isRequired,
}

export default MusicTable
