import { Dispatch } from 'redux'
import { Redirect } from 'react-router-dom'
import * as React from 'react'

import RelatedAlbums from '../RelatedAlbums'
import Album from '../ArtistView/Album'
import * as types from '../../constants/ActionTypes'

type Props = {
  album: any,
  queue: any,
  albumsByArtist: any,
  artistMetadata: any,
  className: string|null,
  collection: any,
  dispatch: Dispatch,
  songs: any,
  songsByAlbum: any
}


export default class AlbumView extends React.Component<Props> {
  render() {
    const { album, collection: { albums, albumsByArtist } } = this.props

    if (!album) {
      return (
        <div>
          <Redirect to='/' />
        </div>
      )
    }

    const relatedAlbums = albumsByArtist && albumsByArtist[album.artist.id] && albumsByArtist[album.artist.id].map((albumId: string) => {
      return albums[albumId]
    })

    return (
      <div className={`artist-view ${this.props.className} z-50`}>
        <div className='main w-full z-10 md:p-4'>
          <h2 className='text-center text-3xl py-3'>{ album.name }</h2>
          <Album
            queue={this.props.queue}
            album={this.props.album}
            dispatch={this.props.dispatch}
            collection={this.props.collection}
            songs={this.props.songsByAlbum[album.id]}
          />
          <div className='w-full'>
            <RelatedAlbums albums={relatedAlbums} />
          </div>
          <div className='placeholder'></div>
        </div>
      </div>
    )
  }
}
