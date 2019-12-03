import { Dispatch } from 'redux'
import { Redirect } from 'react-router-dom'
import * as React from 'react'

import Album from './Album'
import Artist from '../../entities/Artist'
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

    const extractSummary = (): string => {
      if (this.props.artistMetadata && this.props.artistMetadata.artist) {
        return this.props.artistMetadata.artist.bio.content
      }

      return ''
    }

    return (
      <div className={`artist-view ${this.props.className} z-50`}>
        <div className='main w-full z-10 md:p-4'>
          <h2 className='text-center text-3xl py-3'>{ artist.name }</h2>
          <p dangerouslySetInnerHTML={{__html: extractSummary()}} />
          {
            albumsByArtist.map((albumId: string) => {
              return (
                <Album
                  album={albums[albumId]}
                  dispatch={this.props.dispatch}
                  collection={this.props.collection}
                  songs={songsByAlbum[albumId]}
                />
              )
            })
          }
          <div className='placeholder'></div>
        </div>
      </div>
    )
  }
}
