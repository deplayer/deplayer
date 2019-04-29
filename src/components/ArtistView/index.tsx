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
  albumsByArtist: any,
  artist: Artist,
  songs: any,
  songsByAlbum: any,
  albums: any,
  className: string|null
}

export default class ArtistView extends React.Component<Props> {
  render() {
    const {
      artist,
      albumsByArtist,
      albums,
      songsByAlbum
    } = this.props

    if (!artist) {
      return (
        <div>
          <Redirect to='/' />
        </div>
      )
    }

    const extractSong = (album) => {
      if (!songsByAlbum[album.id]) {
        return null
      }

      return songsByAlbum[album.id].map((songId) => {
        const songRow = this.props.collection.rows[songId]
        const songObj = new Song(songRow)
        return (
          <SongRow
            style={ {} }
            key={ songId }
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

    return (
      <div className={`artist-view ${this.props.className} main`}>
        <h2>{ artist.name }</h2>
        <h3><Translate value='label.albums'/></h3>
        <ul className='unstyled-list'>
          {
            albumsByArtist.map((albumId) => {
              return (
                <li key={albumId}>
                  <h4>{ albums[albumId].name }</h4>
                  { extractSong(albums[albumId]) }
                </li>
              )
            })
          }
        </ul>
      </div>
    )
  }
}
