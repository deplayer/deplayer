// @flow

import React, { Component } from 'react'
import { Dispatch } from 'redux'

import { setCurrentPlaying, addToPlaylist } from '../../actions/playlist'
import SearchBar from '../SearchBar/SearchBar'

type Props = {
  data: Array<any>,
  page: number,
  offset: number,
  pages: number,
  total: number,
  error?: string,
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

    const errors = this.props.error ? this.props.error: ''

    return (
      <div className='music-table'>
        <SearchBar dispatch={this.props.dispatch} />
        { errors }
        Total songs {this.props.total}
      </div>
    )
  }
}

export default MusicTable
