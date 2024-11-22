import { connect } from 'react-redux'
import PeerList from '../components/PeerList'
import * as types from '../constants/ActionTypes'
import { PeerStatus } from '../services/PeerService'
import Icon from '../components/common/Icon'

interface Props {
  peers: Record<string, PeerStatus>
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

  const handleCloseRightPanel = () => {
    dispatch({ type: types.TOGGLE_RIGHT_PANEL })
  }

  return (
    <div className="p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-4 flex items-center justify-between">
        Social

        <button onClick={handleCloseRightPanel}>
          <Icon icon="faTimes" />
        </button>
      </h2>
      
      <div>
        <p className="text-gray-600 dark:text-gray-400">
          Connect with your friends and share your contents!
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

const mapStateToProps = (state: any) => {
  return {
    peers: state.peers.peers,
    currentRoom: state.peers.currentRoom
  }
}

export default connect(mapStateToProps)(Social) 