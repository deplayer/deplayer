import { connect } from 'react-redux'
import PeerList from '../components/PeerList'
import * as types from '../constants/ActionTypes'

interface Props {
  peers: any
  currentRoom?: string
  dispatch: any
}

const Social = ({ peers, currentRoom, dispatch }: Props) => {
  const handleJoinRoom = (code: string) => {
    const username = localStorage.getItem('username') || 'Anonymous'
    dispatch({ 
      type: types.JOIN_PEER_ROOM, 
      roomCode: code,
      username 
    })
  }

  const handleLeaveRoom = () => {
    dispatch({ type: types.LEAVE_PEER_ROOM });
  }

  console.log('peers:', peers)

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        Social
      </h2>
      
      <div className="mb-8">
        <p className="text-gray-600 dark:text-gray-400">
          Connect with other users and share your stream
        </p>
      </div>

      <PeerList
        peers={peers}
        currentRoom={currentRoom}
        onJoinRoom={handleJoinRoom}
        onLeaveRoom={handleLeaveRoom}
        dispatch={dispatch}
      />
    </div>
  )
}

const mapStateToProps = (state: any) => ({
  peers: state.peers.peers,
  currentRoom: state.peers.currentRoom
})

export default connect(mapStateToProps)(Social) 