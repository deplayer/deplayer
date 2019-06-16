import * as React from 'react'
import { Dispatch } from 'redux'
import { Redirect } from 'react-router-dom'

import Song from '../../entities/Song'
import Artist from '../../entities/Artist'
import SongRow from '../MusicTable/SongRow'
import CoverImage from '../MusicTable/CoverImage'
import * as types from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch,
  collection: any,
  artistMetadata: any,
  albumsByArtist: any,
  artist: Artist,
  songs: any,
  songsByAlbum: any,
  albums: any,
  className: string|null
}

export default class ArtistView extends React.Component<Props> {
  componentDidMount() {
    if (this.props.artist && this.props.artist.name) {
      this.props.dispatch({
        type: types.LOAD_ARTIST,
        artist: this.props.artist
      })
    }
  }

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
            disableCovers
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

    const extractBackground = (): string => {
      const albumId = albumsByArtist[0]
      if (songsByAlbum[albumId]) {
        return this.props.collection.rows[songsByAlbum[albumId][0]].cover.fullUrl
      }

        return ''
    }

    const extractSummary = (): string => {
      if (this.props.artistMetadata && this.props.artistMetadata.artist) {
        return this.props.artistMetadata.artist.bio.content
      }

      return ''
    }

    return (
      <div
        className={`artist-view ${this.props.className}`}
        style={{backgroundImage: `url(${extractBackground()})`}}
      >
        <div className='main'>
          <h2>{ artist.name }</h2>
          <p>{ extractSummary() }</p>
          <ul className='unstyled-list'>
            {
              albumsByArtist.map((albumId) => {
                return (
                  <li className='card' key={albumId}>
                    <h3 className='card-header'>
                      <CoverImage
                        cover={
                          this.props.collection.rows[songsByAlbum[albumId][0]].cover
                        }
                        size='thumbnail'
                        albumName={'N/A'}
                      />
                      <span>{ albums[albumId].name }</span>
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
          <div className='placeholder'></div>
        </div>
      </div>
    )
  }
}
