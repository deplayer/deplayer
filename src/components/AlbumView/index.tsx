import { Dispatch } from 'redux'

import RelatedAlbums from '../RelatedAlbums'
import Album from '../ArtistView/Album'
import { useMatch } from 'react-router'
import { redirect } from 'react-router-dom'
import { getAlbum } from '../../containers/RouteSelectors'

type Props = {
  queue: any,
  albumsByArtist: any,
  artistMetadata: any,
  className: string | null,
  collection: any,
  dispatch: Dispatch,
  songs: any,
  songsByAlbum: any
}


export default function AlbumView(props: Props) {
  const match = useMatch('/album/:id')

  if (!match) {
    return null
  }

  const { collection } = props

  const album = getAlbum(match, collection)

  if (!album) {
    redirect('/')
    return null
  }

  const relatedAlbums = collection.albumsByArtist && collection.albumsByArtist[album.artist.id] && collection.albumsByArtist[album.artist.id].map((albumId: string) => {
    return collection.albums[albumId]
  })

  return (
    <div className={`artist-view ${props.className} z-50`}>
      <div className='main w-full z-10 md:p-4'>
        <h2 className='text-center text-3xl py-3'>{album.name}</h2>
        <Album
          queue={props.queue}
          album={album}
          dispatch={props.dispatch}
          collection={props.collection}
          songs={props.songsByAlbum[album.id]}
        />
        <div className='w-full'>
          <RelatedAlbums albums={relatedAlbums} />
        </div>
        <div className='placeholder'></div>
      </div>
    </div>
  )
}
