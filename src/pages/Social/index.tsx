import { Translate } from 'react-redux-i18n'
import { connect } from 'react-redux'

import PeerList from '../../components/PeerList'
import { State as PeerState } from '../../reducers/peers'
import * as types from '../../constants/ActionTypes'
import BodyMessage from '../../components/BodyMessage'

type Props = {
  peers: PeerState
  dispatch: any
}

const Social = ({ peers, dispatch }: Props) => {
  const handleJoinRoom = (code: string) => {
    const username = localStorage.getItem('username') || 'Anonymous'
    dispatch({ 
      type: types.JOIN_PEER_ROOM, 
      roomCode: code,
      username 
    })
  }

  const handleShareStream = (peerId: string) => {
    dispatch({ type: types.SHARE_STREAM, peerId })
  }

  if (!peers.currentRoom && peers.peers.length === 0) {
    return (
      <div className="social z-10 flex flex-col w-full overflow-y-auto h-full">
        <BodyMessage 
          message={
            <div className="flex flex-col">
              <Translate value="social.empty.title" />
              <Translate value="social.empty.description" />
            </div>
          } 
        />
      </div>
    )
  }

  return (
    <div className="social z-10 flex flex-col w-full overflow-y-auto h-full">
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">
          <Translate value="social.title" />
        </h2>
        
        <div className="mb-8">
          <p className="text-gray-600 dark:text-gray-400">
            <Translate value="social.description" />
          </p>
        </div>

        <PeerList
          peers={peers.peers}
          currentRoom={peers.currentRoom}
          onJoinRoom={handleJoinRoom}
          onShareStream={handleShareStream}
          dispatch={dispatch}
        />
      </div>
    </div>
  )
}

const mapStateToProps = (state: any) => ({
  peers: state.peers
})

export default connect(mapStateToProps)(Social) 