// @flow

import React, { Component } from 'react'
import { Dispatch } from 'redux'
import { Table } from 'semantic-ui-react'

import Song from '../../entities/Song'
import { setCurrentPlaying, addToPlaylist } from '../../actions/playlist'
import SongRow from './SongRow'

type Props = {
  data: Array<Song>,
  page: number,
  offset: number,
  pages: number,
  total: number,
  error?: string,
  dispatch: Dispatch,
}

class MusicTable extends Component<Props> {
  onAddToPlaylistClick(song: Song) {
    this.props.dispatch(addToPlaylist(song))
  }

  play(song: any) {
    this.props.dispatch(setCurrentPlaying(song))
  }

  render() {
    const errors = this.props.error ? this.props.error: ''

    const songs = this.props.data.map((song) => {
      return <SongRow key={song.id} song={song} />
    })

    return (
      <Table className='music-table'>
        <Table.Header>
          <Table.Row>
            <Table.Cell>{ errors }</Table.Cell>
          </Table.Row>
        </Table.Header>
        { songs }
        <Table.Footer>
          <Table.Row>
            <Table.Cell>Total songs {this.props.total}</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table>
    )
  }
}

export default MusicTable
