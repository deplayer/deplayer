// @flow

import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import Player from '../components/Player/Player'

const ConnectedPlayer = connect(
  (state) => ({
    player: state.player,
    playlist: state.playlist,
    collection: state.collection,
    itemCount: state.playlist.trackIds ? state.playlist.trackIds.length : 0
  })
)(Player)

const RoutedPlayer = withRouter(props => <ConnectedPlayer {...props}/>)

export default RoutedPlayer
