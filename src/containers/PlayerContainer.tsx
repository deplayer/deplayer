import { connect } from 'react-redux'
import PlayerControls from '../components/Player/PlayerControls'
import { useLocation } from 'react-router'
import { State } from '../reducers'

const ConnectedPlayer = connect(
  (state: State) => ({
    app: state.app,
    settings: state.settings,
    slim: false,
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
