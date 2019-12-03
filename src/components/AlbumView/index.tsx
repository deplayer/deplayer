import { Dispatch } from 'redux'
import { Redirect } from 'react-router-dom'
import * as React from 'react'

import Album from '../ArtistView/Album'
import * as types from '../../constants/ActionTypes'

type Props = {
  album: any,
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
    const { album } = this.props

    if (!album) {
      return (
        <div>
          <Redirect to='/' />
        </div>
      )
    }

    return (
      <div className={`artist-view ${this.props.className} z-50`}>
        <div className='main w-full z-10 md:p-4'>
          <h2 className='text-center text-3xl py-3'>{ album.name }</h2>
          <Album
            album={this.props.album}
            dispatch={this.props.dispatch}
            collection={this.props.collection}
            songs={this.props.songsByAlbum[album.id]}
          />
          <div className='placeholder'></div>
        </div>
      </div>
    )
  }
}
