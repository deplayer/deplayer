import { Dispatch } from 'redux'
import * as React from 'react'

import Tag from '../common/Tag'
import Album from './Album'
import Artist from '../../entities/Artist'
import * as types from '../../constants/ActionTypes'
import { State as CollectionState } from '../../reducers/collection'

type Props = {
  queue: any,
  albums: any,
  albumsByArtist: any[],
  artist: Artist,
  artistMetadata: any,
  className: string | null,
  collection: any,
  dispatch: Dispatch,
  songs: any,
  songsByAlbum: any
}

function extractBackground(
  collection: CollectionState,
  songsByAlbum: any[],
  albumsByArtist: any[]
): string {
  const albumId = albumsByArtist && albumsByArtist.length && albumsByArtist[0]
  if (albumId && songsByAlbum[albumId]) {
    return collection.rows[songsByAlbum[albumId][0]]?.cover?.fullUrl
  }

  return ''
}


export default function ArtistView(props: Props) {
  const {
    artist,
    albums,
    albumsByArtist,
    songsByAlbum,
    collection
  } = props

  React.useEffect(() => {
    if (props.artist && props.artist.name) {
      props.dispatch({
        type: types.LOAD_ARTIST,
        artist: props.artist
      })
    }

    props.dispatch({
      type: types.SET_BACKGROUND_IMAGE,
      backgroundImage: extractBackground(collection, songsByAlbum, albumsByArtist)
    })
  }, [])

  const extractSummary = (): string => {
    if (props.artistMetadata && props.artistMetadata.artist) {
      return props.artistMetadata.artist.bio.content
    }

    return ''
  }

  const albumRows = albumsByArtist?.map((albumId: string) => {
    return (
      <Album
        queue={props.queue}
        key={albumId}
        album={albums[albumId]}
        dispatch={props.dispatch}
        collection={props.collection}
        songs={songsByAlbum[albumId]}
      />
    )
  })

  return (
    <div data-testid="artist-view" className={`artist-view ${props.className} z-50`}>
      <div className='main w-full z-10 md:p-4'>
        <h2 className='text-center text-3xl py-2'>{artist.name}</h2>
        <p dangerouslySetInnerHTML={{ __html: extractSummary() }} />
        {
          props.artistMetadata && props.artistMetadata['life-span'] && (
            <div className='text-center text-md'>
              {props.artistMetadata['life-span'].begin} {props.artistMetadata['life-span'].end && '- ' + props.artistMetadata['life-span'].end}
            </div>
          )
        }
        {
          props.artistMetadata && props.artistMetadata['country'] && (
            <div className='text-center text-md'>
              {props.artistMetadata['country']}
            </div>
          )
        }
        <div className='py-4 text-center'>
          {
            props.artistMetadata && props.artistMetadata['relations'] && props.artistMetadata['relations'].map((relation: any, index: number) => {
              return (
                <div className='mr-2 py-1 inline-block'>
                  <Tag key={index} transparent>
                    <a target="_blank" href={relation.url.resource}>{relation.type}</a>
                  </Tag>
                </div>
              )
            })
          }
        </div>

        <div className='yt-4'>
          {albumRows}
        </div>
        <div className='placeholder'></div>
      </div>
    </div>
  )
}
