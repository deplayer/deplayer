// @flow

import React, { Component } from 'react'
import { Dispatch } from 'redux'
import { Table } from 'semantic-ui-react'
import { Translate } from 'react-redux-i18n'

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
    const errors = this.props.error ?
      <Table.Row><Table.Cell>{ this.props.error }</Table.Cell></Table.Row>
      : null

    const songs = this.props.data.map((song) => {
      return <SongRow key={song.id} song={song} />
    })

    return (
      <Table className='music-table'>
        <Table.Header>
          <Table.Row>
            <Table.Cell></Table.Cell>
            <Table.Cell><Translate value="song.row.song" /></Table.Cell>
            <Table.Cell><Translate value="song.row.artist" /></Table.Cell>
            <Table.Cell><Translate value="song.row.album" /></Table.Cell>
            <Table.Cell><Translate value="song.row.dateAdded" /></Table.Cell>
            <Table.Cell><Translate value="song.row.time" /></Table.Cell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          { errors }
          { songs }
        </Table.Body>
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
