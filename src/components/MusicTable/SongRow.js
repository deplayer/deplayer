// @flow

import React from 'react'
import { Table } from 'semantic-ui-react'
import { Translate } from 'react-redux-i18n'
import { Dispatch } from 'redux'

import { ADD_TO_COLLECTION } from '../../constants/ActionTypes'
import { getDurationStr } from '../../utils/timeFormatter'
import Song from '../../entities/Song'
import CoverImage from './CoverImage'

type Props = {
  song: Song,
  isCurrent: boolean,
  onClick: () => any,
  dispatch: Dispatch
}

const SongRow = (props: Props) => {

  const addToCollection = (song) => {
    props.dispatch({type: ADD_TO_COLLECTION, data: [song]})
  }

  const { song, onClick } = props
  const nonAvailable = <Translate value='song.row.na' />
  return (
    <Table.Row
      className={`song-row ${ props.isCurrent ? 'current': ''}`}
      onClick={onClick}
    >
      <Table.Cell className='collapsing'>
        <CoverImage cover={song.cover} size='thumbnail' albumName={song.album.name} />
      </Table.Cell>
      <Table.Cell>
        <span className='label'><Translate value='song.label.title' /></span>
        { song.title }
      </Table.Cell>
      <Table.Cell>
        <span className='label'><Translate value='song.label.album' /></span>
        { song.album ? song.album.name: nonAvailable }
      </Table.Cell>
      <Table.Cell>
        <span className='label'><Translate value='song.label.artist' /></span>
        { song.artist ? song.artist.name: nonAvailable }
      </Table.Cell>
      <Table.Cell>
        <span className='label'><Translate value='song.label.dateAdded' /></span>
        { song.dateAdded ? song.dateAdded: nonAvailable }
      </Table.Cell>
      <Table.Cell>
        <span className='label'><Translate value='song.label.duration' /></span>
        { getDurationStr(song.duration) }
      </Table.Cell>
      <Table.Cell>
        <span className='label'><Translate value='song.label.genre' /></span>
        { song.genre }
      </Table.Cell>
      <Table.Cell>
        <button
          className='add-to-collection'
          onClick={() => addToCollection(song)}
        >
          <Translate value='song.button.addToCollection' />
        </button>
      </Table.Cell>
    </Table.Row>
  )
}

export default SongRow
