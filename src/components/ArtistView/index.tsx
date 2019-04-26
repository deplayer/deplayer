import * as React from 'react'
import { Dispatch } from 'redux'
import { Redirect } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'

import Song from '../../entities/Song'
import Artist from '../../entities/Artist'
import SongRow from '../MusicTable/SongRow'
import * as types from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch,
  collection: any,
  artist: Artist,
  songs: any,
  albums: any,
  className: string|null
}

export default class ArtistView extends React.Component<Props> {
  render() {
    const { artist, songs, albums } = this.props

    if (!artist) {
      return (
        <div>
          <Redirect to='/' />
        </div>
      )
    }

    return (
      <div className={`artist-view ${this.props.className} main`}>
        <h2>{ artist.name }</h2>
        <h3><Translate value='label.albums'/></h3>
        <ul>
          {
            albums.map((album) => {
              return (<li>{ album }</li>)
            })
          }
        </ul>
        <h3><Translate value='label.songs'/></h3>
        {
          songs.map((songId) => {
            const songObj = new Song(this.props.collection.rows[songId])
            return (
              <SongRow
                style={ {} }
                dispatch={this.props.dispatch}
                isCurrent={ false }
                slim={ true }
                onClick={() => {
                  this.props.dispatch({type: types.SET_CURRENT_PLAYING, songId: songObj.id})
                }}
                song={songObj}
              />
            )
          })
        }
      </div>
    )
  }
}
