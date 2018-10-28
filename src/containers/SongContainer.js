import { connect } from 'react-redux'
import SongView from '../components/SongView'

export default connect(
  (state) => ({
    song: state.player.currentPlaying
  })
)(SongView)
