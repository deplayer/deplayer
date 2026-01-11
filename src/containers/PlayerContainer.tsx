import { connect } from 'react-redux'
import PlayerControls from '../components/Player/PlayerControls'
import { useLocation } from 'react-router'
import { State } from '../reducers'

const ConnectedPlayer = connect(
  (state: State) => ({
    app: state.app,
    slim: false,
    player: state.player,
    collection: state.collection
  })
)((props: any) => {
  const location = useLocation()

  return (
    <PlayerControls {...props} location={location} />
  )
})

export default ConnectedPlayer
