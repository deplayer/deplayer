// @flow

import React from 'react'
import { Table } from 'semantic-ui-react'
import { Translate } from 'react-redux-i18n'
import { Dispatch } from 'redux'

import { ADD_TO_COLLECTION, REMOVE_FROM_COLLECTION } from '../../constants/ActionTypes'
import { getDurationStr } from '../../utils/timeFormatter'
import Song from '../../entities/Song'
import CoverImage from './CoverImage'

type Props = {
  song: Song,
  isCurrent: boolean,
  onClick: () => any,
  dispatch: Dispatch,
  disableAddButton?: boolean
}

const SongRow = (props: Props) => {

  const addToCollection = () => {
    props.dispatch({type: ADD_TO_COLLECTION, data: [props.song]})
  }

  const removeFromCollection = () => {
    props.dispatch({type: REMOVE_FROM_COLLECTION, data: [props.song]})
  }

  const { song, onClick, disableAddButton } = props

  const nonAvailable = <Translate value='song.row.na' />
  return (
    <Table.Row
      className={`song-row ${ props.isCurrent ? 'current': ''}`}
    >
      <Table.Cell className='collapsing'>
        <CoverImage
          cover={song.cover}
          size='thumbnail'
          albumName={song.album ? song.album.name : 'N/A'}
        />
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
          className='play circle spaced'
          onClick={onClick}
        >
          <i className='icon play circle'></i>
        </button>
        { !disableAddButton &&
          <button
            className='add-to-collection circle spaced'
            onClick={addToCollection}
          >
            <i className='icon add circle'></i>
          </button>
        }
        { disableAddButton &&
          <button
            className='remove-from-collection circle spaced'
            onClick={removeFromCollection}
          >
            <i className='icon remove circle'></i>
          </button>
        }
      </Table.Cell>
    </Table.Row>
  )
}

export default SongRow
