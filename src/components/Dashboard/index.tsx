import { Translate } from 'react-redux-i18n'
import React from 'react'

import MediaSlider from '../MediaSlider'

type Props = {
  collection: any
}

const Dashboard = (props: Props) => {
  const MAX_LIST_ITEMS = 25

  const mediaItems = props.collection.songsByNumberOfPlays.map((songId: string) => {
    return props.collection.rows[songId]
  })

  return (
    <div className='z-10 w-full flex flex-col px-4'>
      <MediaSlider
        title={<Translate value='titles.mostPlayedSongs'/>}
        mediaItems={mediaItems.slice(0, MAX_LIST_ITEMS)}
      />
    </div>
  )
}

export default Dashboard
