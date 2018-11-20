// @flow

import React from 'react'
import { Dispatch } from 'redux'
import { Table } from 'semantic-ui-react'
import { Translate } from 'react-redux-i18n'

import {
  setCurrentPlaying
} from '../../actions/playlist'
import SongRow from './SongRow'

type Props = {
  error?: string,
  playlist: any,
  tableIds: any,
  collection: any,
  totalSongs: number,
  dispatch: Dispatch,
  disableAddButton?: boolean,
}

const MusicTable = (props: Props) => {
  const errors = props.error ?
    <div><div>{ props.error }</div></div>
    : null

  const { id } = props.playlist.currentPlaying

  const songs = props.tableIds.map((songId) => {
    const song = props.collection.rows[songId]
    if (!song || !song.id) {
      return <div key={songId}><div><Translate value='error.noSongFound' /></div></div>
    }

    return <SongRow
      key={song.id}
      song={song}
      isCurrent={id === song.id}
      onClick={() => {
        props.dispatch(setCurrentPlaying(song))
      }}
      disableAddButton={props.disableAddButton}
      dispatch={props.dispatch}
    />
  })

  return (
    <div className='music-table'>
      <div>
        { errors }
        { songs }
      </div>
      <div>
        <Table.Row>
          <div>Total songs {props.totalSongs}</div>
        </Table.Row>
      </div>
    </div>
  )
}

export default MusicTable
