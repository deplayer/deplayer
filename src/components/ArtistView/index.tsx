import { Dispatch } from 'redux'
import { Redirect } from 'react-router-dom'
import * as React from 'react'

import Tag from '../common/Tag'
import Album from './Album'
import Artist from '../../entities/Artist'
import * as types from '../../constants/ActionTypes'

type Props = {
  queue: any,
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

    const albumRows = albumsByArtist.map((albumId: string) => {
      return (
        <Album
          queue={this.props.queue}
          key={albumId}
          album={albums[albumId]}
          dispatch={this.props.dispatch}
          collection={this.props.collection}
          songs={songsByAlbum[albumId]}
        />
      )
    })

    return (
      <div className={`artist-view ${this.props.className} z-50`}>
        <div className='main w-full z-10 md:p-4'>
          <h2 className='text-center text-3xl py-2'>{ artist.name }</h2>
          <p dangerouslySetInnerHTML={{__html: extractSummary()}} />
          {
            this.props.artistMetadata['life-span'] && (
              <div className='text-center text-md'>
                { this.props.artistMetadata['life-span'].begin } { this.props.artistMetadata['life-span'].end && '- ' + this.props.artistMetadata['life-span'].end }
              </div>
            )
          }
          {
            this.props.artistMetadata['country'] && (
              <div className='text-center text-md'>
                { this.props.artistMetadata['country'] }
              </div>
            )
          }
          <div className='py-4 text-center'>
            {
              this.props.artistMetadata['relations'] && this.props.artistMetadata['relations'].map((relation: any, index: number) => {
                return (
                  <div className='mr-2 py-1 inline-block'>
                    <Tag key={index} transparent>
                      <a target="_blank" href={ relation.url.resource }>{ relation.type }</a>
                    </Tag>
                  </div>
                )
              })
            }
          </div>

          <div className='yt-4'>
            { albumRows }
          </div>
          <div className='placeholder'></div>
        </div>
      </div>
    )
  }
}
