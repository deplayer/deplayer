import { connect } from 'react-redux'
import PlayerControls from '../components/Player/PlayerControls'
import { useLocation } from 'react-router'

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
  const location = useLocation()

  return (
    <PlayerControls {...props} location={location} />
  )
})

export default ConnectedPlayer
