import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import Player from '../components/Player/Player'
import PlayerV2 from '../components/Player/PlayerV2'

const ConnectedPlayer = connect(
  (state) => ({
    settings: state.settings,
    player: state.player,
    queue: state.queue,
    collection: state.collection,
    itemCount: state.queue.trackIds ? state.queue.trackIds.length : 0
  })
)((props: any) => {
  console.log('props.settings:' ,props.settings)
  if (props.settings.settings.app.reactPlayer.enabled) {
    return (
      <PlayerV2 {...props} />
    )
  }

  return <Player {...props} />
})

const RoutedPlayer = withRouter(props => <ConnectedPlayer {...props}/>)

export default RoutedPlayer
