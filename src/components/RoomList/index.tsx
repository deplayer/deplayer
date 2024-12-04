import React from 'react'
import { Translate } from 'react-redux-i18n'
import Button from '../common/Button'
import Icon from '../common/Icon'
import { PeerStatus } from '../../services/PeerService'
import { Dispatch } from 'redux'
import * as types from '../../constants/ActionTypes'
import { IMedia } from '../../entities/Media'
import CreateRoomModal from '../CreateRoomModal'
import ShareRoomModal from '../ShareRoomModal'
import { Room } from '../../reducers/rooms'
import { State as RootState } from '../../reducers'
import { connect } from 'react-redux'

interface Props {
  peers: Record<string, Record<string, PeerStatus>>
  rooms: Room[]
  onJoinRoom: (code: string) => void
  dispatch: Dispatch
}

const RoomList = ({ peers, rooms, dispatch, onJoinRoom }: Props) => {
  const [showJoinModal, setShowJoinModal] = React.useState(false)
  const [showShareModal, setShowShareModal] = React.useState(false)
  const [selectedRoom, setSelectedRoom] = React.useState('')
  const [expandedRooms, setExpandedRooms] = React.useState<string[]>([])

  const requestSongFile = (peerId: string, media: IMedia, roomCode: string) => {
    dispatch({ type: types.REQUEST_STREAM, peerId, media: media, roomCode })
  }

  const requestRealtimeStream = (peerId: string, roomCode: string) => {
    dispatch({ type: types.REQUEST_REALTIME_STREAM, peerId, roomCode })
  }

  const handleCreateRoom = (roomCode: string) => {
    onJoinRoom(roomCode)
  }

  const handleShareRoom = (roomCode: string) => {
    setSelectedRoom(roomCode)
    setShowShareModal(true)
  }

  const handleLeaveRoom = (roomCode: string) => {
    dispatch({ type: types.REMOVE_ROOM, room: roomCode })
  }

  const toggleRoomExpansion = (roomId: string) => {
    setExpandedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    )
  }

  const renderPeer = (peer: PeerStatus) => (
    <div key={peer.peerId} className="peer-item flex flex-col items-center justify-between py-2">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <Icon icon="faUser" className="mr-2" />
          <span className="font-bold block">{peer.username}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {peer.media?.cover?.thumbnailUrl && (
          <img
            src={peer.media?.cover?.thumbnailUrl}
            alt={peer.media?.title}
            className="w-12 h-12 rounded object-cover my-4"
          />
        )}
        <div>
          {peer.media && (
            <span className="text-sm opacity-70">
              {peer.isPlaying ? '▶' : '⏸'} {peer.media.title} - {peer.media.artist.name}
            </span>
          )}
        </div>
      </div>
      <div className="w-full pt-2 flex gap-2">
        {peer.media && (
          <>
            <Button
              size="xs"
              onClick={() => requestSongFile(peer.peerId, peer.media!, peer.roomCode)}
              className="bg-primary hover:bg-primary-dark flex-1"
            >
              <Icon icon="faDownload" className="mr-2" />
              <Translate value="peer.request" />
            </Button>
            
            <Button
              size="xs"
              onClick={() => requestRealtimeStream(peer.peerId, peer.roomCode)}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              <Icon icon="faStream" className="mr-2" />
              <Translate value="peer.streamRealtime" />
            </Button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="peer-list flex flex-col">
      <div className="peers-section mt-4 mb-10">
        { rooms.length > 0 && (
          rooms.map((room) => (
            <div key={room.id} className="mb-6 border border-gray-600 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {Object.keys(peers[room.id] || {}).length > 0 && (
                    <button
                      className="text-gray-400 hover:text-white transition-colors"
                      onClick={() => toggleRoomExpansion(room.id)}
                    >
                      <Icon 
                        icon={expandedRooms.includes(room.id) ? "faChevronDown" : "faChevronRight"} 
                        className="w-4 h-4" 
                      />
                    </button>
                  )}
                  <h4 
                    className="text-lg font-semibold cursor-pointer hover:text-blue-500"
                    onClick={() => handleShareRoom(room.id)}
                  >
                    Room: {room.id}
                    <span className="text-sm text-gray-400 ml-2">
                      ({Object.keys(peers[room.id] || {}).length} {Object.keys(peers[room.id] || {}).length === 1 ? 'peer' : 'peers'})
                    </span>
                  </h4>
                </div>
                <Button
                  onClick={() => handleLeaveRoom(room.id)}
                  size="xs"
                  transparent
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Translate value="peer.leave" />
                  <Icon icon="faSignOutAlt" className="ml-2" />
                </Button>
              </div>
              {expandedRooms.includes(room.id) && (
                <div className="space-y-4">
                  {Object.values(peers[room.id] || {}).map(renderPeer)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => setShowJoinModal(true)}>
          <Icon icon="faPlus" className="mr-2" />
          <Translate value="peer.createRoom" />
        </Button>
      </div>


      <CreateRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onCreateRoom={handleCreateRoom}
      />

      <ShareRoomModal
        isOpen={showShareModal}
        roomCode={selectedRoom}
        onClose={() => setShowShareModal(false)}
        dispatch={dispatch}
      />
    </div>
  )
}

const mapStateToProps = (state: RootState) => ({
  peers: state.peers.peers,
  rooms: state.rooms.rooms,
})

export default connect(mapStateToProps)(RoomList) 