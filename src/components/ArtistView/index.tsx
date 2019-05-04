import * as React from 'react'
import { Dispatch } from 'redux'
import { Redirect } from 'react-router-dom'

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
        <ul className='unstyled-list'>
          {
            albumsByArtist.map((albumId) => {
              return (
                <li className='card' key={albumId}>
                  <h3 className='card-header'>
                    { albums[albumId].name }
                    <button
                      onClick={() => {
                        this.props.dispatch({type: types.ADD_ALBUM_TO_PLAYLIST, albumId })
                      }}
                    >
                      <i className='fa fa-play' />
                    </button>
                  </h3>
                  <div className='card-body'>
                    { extractSong(albums[albumId]) }
                  </div>
                </li>
              )
            })
          }
        </ul>
      </div>
    )
  }
}
