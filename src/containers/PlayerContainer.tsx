import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PlayerV2 from '../components/Player/PlayerV2'

const ConnectedPlayer = connect(
  (state) => ({
    player: state.player,
    queue: state.queue,
    collection: state.collection,
    itemCount: state.queue.trackIds ? state.queue.trackIds.length : 0
  })
)(PlayerV2)

const RoutedPlayer = withRouter(props => <ConnectedPlayer {...props}/>)

export default RoutedPlayer
