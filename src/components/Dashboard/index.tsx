import { Translate } from 'react-redux-i18n'
import React from 'react'

import BodyMessage from '../BodyMessage'
import MediaSlider from '../MediaSlider'
import RelatedAlbums from '../RelatedAlbums'
import { Link } from 'react-router-dom'

type Props = {
  collection: any
}

const Dashboard = (props: Props) => {
  const MAX_LIST_ITEMS = 25

  const mediaItems = props.collection.songsByNumberOfPlays.map((songId: string) => {
    return props.collection.rows[songId]
  })

  const albums = Object
    .keys(props.collection.albums)
    .slice(0, MAX_LIST_ITEMS)
    .map((albumId) => props.collection.albums[albumId])

  if (!albums.length && !mediaItems.length) {
    return (
      <BodyMessage message={
        <div>
          <Translate value='message.noMostPlayed' />
          <br/>
          <Link to={'/collection'} className='h-32 button'><Translate value='message.goToCollection' /></Link>
        </div>
      }/>
    )
  }

  return (
    <div className='z-10 w-full flex flex-col'>
      <MediaSlider
        loading={props.collection.loading}
        title={<Translate value='titles.mostPlayedSongs'/>}
        mediaItems={mediaItems.slice(0, MAX_LIST_ITEMS)}
      />
      <RelatedAlbums albums={albums} />
    </div>
  )
}

export default Dashboard
