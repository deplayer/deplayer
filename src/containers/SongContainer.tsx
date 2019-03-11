import { connect } from 'react-redux'
import * as React from 'react'
import { withRouter } from 'react-router-dom'

import SongView from '../components/SongView'

const RoutedSongView = withRouter(props => <SongView {...props}/>)

export default connect(
  (state) => ({
    collection: state.collection
  })
)(RoutedSongView)
