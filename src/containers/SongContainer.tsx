import { connect } from 'react-redux'
import * as React from 'react'
import { withRouter } from 'react-router-dom'

import SongView from '../components/SongView/SongView'

const RoutedSongView = withRouter((props: any) => <SongView {...props}/>)

const getSongId = (router: any) : string => {
  const songFinder = router.location.pathname.match(/\/song\/(.*)/)

  if (songFinder && songFinder[1]) {
    return songFinder[1]
  }

  return '0'
}

export default connect(
  (state: any) => {
    return {
      collection: state.collection,
      queue: state.queue,
      loading: state.collection.loading,
      song: state.collection.rows[getSongId(state.router)] || state.collection.rows[state.queue.currentPlaying]
    }
  }
)(RoutedSongView)
