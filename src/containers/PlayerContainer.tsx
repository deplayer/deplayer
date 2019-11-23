import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PlayerControls from '../components/Player/PlayerControls'

const ConnectedPlayer = connect(
  (state: any) => ({
    app: state.app,
    settings: state.settings,
    slim: state.app.slimPlayer,
    player: state.player,
    queue: state.queue,
    collection: state.collection,
    itemCount: state.queue.trackIds ? state.queue.trackIds.length : 0
  })
)((props: any) => {
  return (
    <PlayerControls {...props} />
  )
})

const RoutedPlayer = withRouter(props => <ConnectedPlayer {...props}/>)

export default RoutedPlayer
