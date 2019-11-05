import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PlayerControls from '../components/Player/PlayerControls'
import Player from '../components/Player/Player'
import PlayerV2 from '../components/Player/PlayerV2'

const ConnectedPlayer = connect(
  (state: any) => ({
    settings: state.settings,
    slim: state.app.slimPlayer,
    player: state.player,
    queue: state.queue,
    collection: state.collection,
    itemCount: state.queue.trackIds ? state.queue.trackIds.length : 0
  })
)((props: any) => {
  if (props.settings.settings.app.reactPlayer.enabled) {
    return (
      <PlayerControls PlayerComponent={PlayerV2} {...props} />
    )
  }

  return <PlayerControls PlayerComponent={Player} {...props} />
})

const RoutedPlayer = withRouter(props => <ConnectedPlayer {...props}/>)

export default RoutedPlayer
