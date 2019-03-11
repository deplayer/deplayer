import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import Player from '../components/Player/Player'

const ConnectedPlayer = connect(
  (state) => ({
    player: state.player,
    queue: state.queue,
    collection: state.collection,
    itemCount: state.queue.trackIds ? state.queue.trackIds.length : 0
  })
)(Player)

const RoutedPlayer = withRouter(props => <ConnectedPlayer {...props}/>)

export default RoutedPlayer
