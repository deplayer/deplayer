// @flow

import React from 'react'
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
    <div
      className={`song-row ${ props.isCurrent ? 'current': ''}`}
    >
      <div className='collapsing'>
        <CoverImage
          cover={song.cover}
          size='thumbnail'
          albumName={song.album ? song.album.name : 'N/A'}
        />
      </div>
      <div>
        <span className='label'><Translate value='song.label.title' /></span>
        { song.title }
      </div>
      <div>
        <span className='label'><Translate value='song.label.album' /></span>
        { song.album ? song.album.name: nonAvailable }
      </div>
      <div>
        <span className='label'><Translate value='song.label.artist' /></span>
        { song.artist ? song.artist.name: nonAvailable }
      </div>
      <div>
        <span className='label'><Translate value='song.label.dateAdded' /></span>
        { song.dateAdded ? song.dateAdded: nonAvailable }
      </div>
      <div>
        <span className='label'><Translate value='song.label.duration' /></span>
        { getDurationStr(song.duration) }
      </div>
      <div>
        <span className='label'><Translate value='song.label.genre' /></span>
        { song.genre }
      </div>
      <div>
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
      </div>
    </div>
  )
}

export default SongRow
