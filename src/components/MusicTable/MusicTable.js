// @flow

import React from 'react'
import { Dispatch } from 'redux'
import { Table } from 'semantic-ui-react'
import { Translate } from 'react-redux-i18n'

import {
  setCurrentPlaying
} from '../../actions/playlist'
import { SET_COLUMN_SORT } from '../../constants/ActionTypes'
import SongRow from './SongRow'

type Props = {
  error?: string,
  playlist: any,
  collection: any,
  dispatch: Dispatch,
}

const MusicTable = (props: Props) => {
  const errors = props.error ?
    <Table.Row><Table.Cell>{ props.error }</Table.Cell></Table.Row>
    : null

  const { id } = props.playlist.currentPlaying

  const songs = props.playlist.trackIds.map((songId) => {
    const song = props.collection.rows[songId]
    if (!song) {
      return <Table.Row><Table.Cell><div><Translate value='error.noSongFound' /></div></Table.Cell></Table.Row>
    }

    return <SongRow
      key={song.id}
      song={song}
      isCurrent={id === song.id}
      onClick={() => {
        props.dispatch(setCurrentPlaying(song))
      }}
    />
  })

  const sortBy = (field, songs) => {
    props.dispatch({
      type: SET_COLUMN_SORT,
      songs,
      column: field
    })
  }

  return (
    <Table className='music-table'>
      <Table.Header>
        <Table.Row>
          <Table.Cell></Table.Cell>
          <Table.Cell><Translate value="song.row.song" /></Table.Cell>
          <Table.Cell><Translate value="song.row.artist" /></Table.Cell>
          <Table.Cell><Translate value="song.row.album" /></Table.Cell>
          <Table.Cell><Translate value="song.row.dateAdded" /></Table.Cell>
          <Table.Cell className='action' onClick={() => sortBy('duration', props.collection.rows)}><Translate value="song.row.time" /></Table.Cell>
          <Table.Cell className='action' onClick={() => sortBy('genre', props.collection.rows)}><Translate value="song.row.genre" /></Table.Cell>
          <Table.Cell><Translate value="song.row.actions" /></Table.Cell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        { errors }
        { songs }
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.Cell>Total songs {props.playlist.trackIds.length}</Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table>
  )
}

export default MusicTable
