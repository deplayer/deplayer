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
import { useSelector } from 'react-redux'

interface Props {
  peers: Record<string, Record<string, PeerStatus>>
  onJoinRoom: (code: string) => void
  onLeaveRoom: (code: string) => void
  dispatch: Dispatch
}

interface RoomGroup {
  roomCode: string
  peers: PeerStatus[]
}

const PeerList = ({ peers, dispatch, onJoinRoom, onLeaveRoom }: Props) => {
  const [showJoinModal, setShowJoinModal] = React.useState(false)
  const [showShareModal, setShowShareModal] = React.useState(false)
  const [selectedRoom, setSelectedRoom] = React.useState('')

  const rooms = useSelector((state: any) => state.rooms.rooms)

  const requestSongFile = (peerId: string, media: IMedia, roomCode: string) => {
    dispatch({ type: types.REQUEST_STREAM, peerId, media: media, roomCode })
  }

  const requestRealtimeStream = (peerId: string, roomCode: string) => {
    dispatch({ type: types.REQUEST_REALTIME_STREAM, peerId, roomCode })
  }

  const groupedPeers = React.useMemo<RoomGroup[]>(() => {
    // Create groups for all rooms, including empty ones
    const groups = rooms.map((roomCode: string) => {
      const roomPeers = peers[roomCode] || {};
      return {
        roomCode,
        peers: Object.values(roomPeers).filter(peer => peer.username)
      };
    });

    // Sort rooms with peers first
    return groups.sort((a: RoomGroup, b: RoomGroup) => {
      if ((a.peers.length > 0 && b.peers.length > 0) || 
          (a.peers.length === 0 && b.peers.length === 0)) {
        return 0;
      }
      return b.peers.length - a.peers.length;
    });
  }, [peers, rooms]);

  React.useEffect(() => {
    console.log('Current peers:', peers)
    console.log('Grouped peers:', groupedPeers)
  }, [peers, groupedPeers])
  
  const handleCreateRoom = (roomCode: string) => {
    onJoinRoom(roomCode)
  }

  const handleShareRoom = (roomCode: string) => {
    setSelectedRoom(roomCode)
    setShowShareModal(true)
  }

  const handleLeaveRoom = (roomCode: string) => {
    onLeaveRoom(roomCode)
    dispatch({ type: types.REMOVE_ROOM, room: roomCode })
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

  const [foldedRooms, setFoldedRooms] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    if (groupedPeers.length > 0) {
      const newFoldedRooms = new Set<string>()
      
      let foundFirstWithPeers = false
      groupedPeers.forEach(group => {
        if (!foundFirstWithPeers && group.peers.length > 0) {
          foundFirstWithPeers = true
        } else {
          newFoldedRooms.add(group.roomCode)
        }
      })
      
      setFoldedRooms(newFoldedRooms)
    }
  }, [groupedPeers])

  const toggleFold = (roomCode: string) => {
    setFoldedRooms(prev => {
      const newFolded = new Set(prev)
      if (newFolded.has(roomCode)) {
        newFolded.delete(roomCode)
      } else {
        newFolded.add(roomCode)
      }
      return newFolded
    })
  }

  return (
    <div className="peer-list flex flex-col">
      <div className="peers-section mt-4 mb-10">
        {groupedPeers.length > 0 ? (
          groupedPeers.map((group) => (
            <div key={group.roomCode} className="mb-6 border border-gray-600 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {group.peers.length > 0 && (
                    <button
                      onClick={() => toggleFold(group.roomCode)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Icon 
                        icon={foldedRooms.has(group.roomCode) ? "faChevronRight" : "faChevronDown"} 
                        className="w-4 h-4" 
                      />
                    </button>
                  )}
                  <h4 
                    className="text-lg font-semibold cursor-pointer hover:text-blue-500"
                    onClick={() => handleShareRoom(group.roomCode)}
                  >
                    Room: {group.roomCode}
                    <span className="text-sm text-gray-400 ml-2">
                      ({group.peers.length} {group.peers.length === 1 ? 'peer' : 'peers'})
                    </span>
                  </h4>
                </div>
                <Button
                  onClick={() => handleLeaveRoom(group.roomCode)}
                  size="xs"
                  transparent
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Translate value="peer.leave" />
                  <Icon icon="faSignOutAlt" className="ml-2" />
                </Button>
              </div>
              {!foldedRooms.has(group.roomCode) && (
                <div className="space-y-4">
                  {group.peers.map(renderPeer)}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">No active rooms</p>
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

export default PeerList 
