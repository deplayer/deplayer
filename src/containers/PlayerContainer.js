// @flow

import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import Player from '../components/Player/Player'

const ConnectedPlayer = connect(
  (state) => ({
    playlist: state.playlist,
    collection: state.collection
  })
)(Player)

const RoutedPlayer = withRouter(props => <ConnectedPlayer {...props}/>)

export default RoutedPlayer
