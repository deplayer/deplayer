import { connect } from 'react-redux'
import Player from '../components/Player/Player'

export default connect(
  (state) => ({
    playlist: state.playlist
  })
)(Player)
