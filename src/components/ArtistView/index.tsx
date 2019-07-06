import * as React from 'react'
import { Dispatch } from 'redux'
import { Redirect } from 'react-router-dom'

import Song from '../../entities/Song'
import Artist from '../../entities/Artist'
import SongRow from '../MusicTable/SongRow'
import CoverImage from '../MusicTable/CoverImage'
import * as types from '../../constants/ActionTypes'

type Props = {
  albums: any,
  albumsByArtist: any,
  artist: Artist,
  artistMetadata: any,
  backgroundImage: string,
  className: string|null,
  collection: any,
  dispatch: Dispatch,
  songs: any,
  songsByAlbum: any
}

const extractBackground = (collection, songsByAlbum, albumsByArtist = []): string => {
  const albumId = albumsByArtist[0]
  if (albumId && songsByAlbum[albumId]) {
    return collection.rows[songsByAlbum[albumId][0]].cover.fullUrl
  }

    return ''
}

export default class ArtistView extends React.Component<Props> {
  componentDidMount() {
    if (this.props.artist && this.props.artist.name) {
      this.props.dispatch({
        type: types.LOAD_ARTIST,
        artist: this.props.artist
      })
    }

    const {
      albumsByArtist,
      songsByAlbum,
      collection
    } = this.props

    this.props.dispatch({
      type: types.SET_BACKGROUND_IMAGE,
      backgroundImage: extractBackground(collection, songsByAlbum, albumsByArtist)
    })
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

    const extractSongs = (album) => {
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

    const extractSummary = (): string => {
      if (this.props.artistMetadata && this.props.artistMetadata.artist) {
        return this.props.artistMetadata.artist.bio.content
      }

      return ''
    }

    return (
      <div
        className={`artist-view ${this.props.className}`}
        style={{backgroundImage: `url(${ this.props.backgroundImage })`}}
      >
        <div className='main'>
          <h2>{ artist.name }</h2>
          <p dangerouslySetInnerHTML={{__html: extractSummary()}} />
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
                      { extractSongs(albums[albumId]) }
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
