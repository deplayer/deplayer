import { Dispatch } from 'redux'
import { Redirect } from 'react-router-dom'
import * as React from 'react'

import Artist from '../../entities/Artist'
import Button from '../common/Button'
import CoverImage from '../MusicTable/CoverImage'
import Song from '../../entities/Song'
import SongRow from '../MusicTable/SongRow'
import * as types from '../../constants/ActionTypes'

type Props = {
  albums: any,
  albumsByArtist: any,
  artist: Artist,
  artistMetadata: any,
  className: string|null,
  collection: any,
  dispatch: Dispatch,
  songs: any,
  songsByAlbum: any
}

const extractBackground = (collection, songsByAlbum, albumsByArtist = []): string => {
  const albumId = albumsByArtist && albumsByArtist.length && albumsByArtist[0]
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
            mqlMatch={false}
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
      <div className={`artist-view ${this.props.className} z-50`}>
        <div className='main'>
          <h2 className='text-center text-xl'>{ artist.name }</h2>
          <p dangerouslySetInnerHTML={{__html: extractSummary()}} />
          {
            albumsByArtist.map((albumId: string) => {
              return (
                <div className='mx-0 z-4 flex flex-col md:flex-row items-center md:items-start mb-16' key={albumId}>
                  <div style={{ top: 50 }} className='md:sticky flex flex-col items-center md:mr-8'>
                    <h3 className='text-lg mb-2'>{ albums[albumId].name }</h3>
                    <div
                      className='h-56 w-56 mb-2 md:h-56 md:w-56 cursor-pointer'
                      onClick={() => {
                        this.props.dispatch({type: types.ADD_ALBUM_TO_PLAYLIST, albumId })
                      }}
                    >
                      <CoverImage
                        cover={
                          this.props.collection.rows[songsByAlbum[albumId][0]].cover
                        }
                        size='thumbnail'
                        albumName={'N/A'}
                      />
                    </div>

                    <Button
                      transparent
                      onClick={() => {
                        this.props.dispatch({type: types.ADD_ALBUM_TO_PLAYLIST, albumId })
                      }}
                    >
                      <i className='fa fa-play' />
                    </Button>
                  </div>
                  <div className='w-100'>
                    { extractSongs(albums[albumId]) }
                  </div>
                </div>
              )
            })
          }
          <div className='placeholder'></div>
        </div>
      </div>
    )
  }
}
