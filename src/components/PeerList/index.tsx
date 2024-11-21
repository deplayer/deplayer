import React from 'react'
import { Translate } from 'react-redux-i18n'
import { QRCodeSVG } from 'qrcode.react'
import Button from '../common/Button'
import Icon from '../common/Icon'
import Modal from '../common/Modal'
import { PeerStatus } from '../../services/PeerService'
import { Dispatch } from 'redux'
import * as types from '../../constants/ActionTypes'
import { IMedia } from '../../entities/Media'

interface Props {
  peers: Record<string, PeerStatus>
  currentRoom?: string
  onJoinRoom: (code: string) => void
  onLeaveRoom: () => void
  dispatch: Dispatch
}

const PeerList = ({ peers, dispatch, currentRoom, onJoinRoom, onLeaveRoom }: Props) => {
  const [showJoinModal, setShowJoinModal] = React.useState(false)
  const [roomCode, setRoomCode] = React.useState('')
  const [username, setUsername] = React.useState(localStorage.getItem('username') || '')

  const requestSongFile = (peerId: string, media: IMedia) => {
    dispatch({ type: types.REQUEST_STREAM, peerId, media: media });
  }

  const shareUrl = currentRoom ?
    `${window.location.origin}/join/${currentRoom}` : ''

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      if (username.trim()) {
        localStorage.setItem('username', username.trim())
      }
      onJoinRoom(roomCode.trim())
      setShowJoinModal(false)
      setRoomCode('')
    }
  }

  return (
    <div className="peer-list flex flex-col">
      <div className="peers-section mt-4 mb-10 border-b pb-4">
        <h3><Translate value="peer.connectedPeers" /></h3>
        {Object.values(peers).map(peer => (
          <div key={peer.peerId} className="peer-item flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              {peer.media?.cover?.thumbnailUrl && (
                <img
                  src={peer.media?.cover?.thumbnailUrl}
                  alt={peer.media?.title}
                  className="w-12 h-12 rounded object-cover"
                />
              )}
              <div>
                <span className="font-bold block">{peer.username}</span>
                {peer.media && (
                  <span className="text-sm opacity-70">
                    {peer.isPlaying ? '▶' : '⏸'} {peer.media.title} - {peer.media.artist.name}
                  </span>
                )}
              </div>
            </div>
            {peer.media && (
              <Button
                onClick={() => {
                  requestSongFile(
                    peer.peerId,
                    peer.media!
                  )
                }}
                className="bg-primary hover:bg-primary-dark"
              >
                <Icon icon="faPlay" className="mr-2" />
                <Translate value="peer.listenAlong" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {currentRoom ? (
        <div className="share-section mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3><Translate value="peer.shareRoom" /></h3>
            <Button
              onClick={onLeaveRoom}
              className="bg-red-500 hover:bg-red-600"
            >
              <Translate value="peer.leaveRoom" />
            </Button>
          </div>
          <div className="flex items-center gap-4 flex-col">
            <input
              readOnly
              value={shareUrl}
              className="p-2 rounded dark:text-black"
            />
            <QRCodeSVG value={shareUrl} marginSize={2} />
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowJoinModal(true)}>
          <Translate value="peer.joinRoom" />
        </Button>
      )}

      {showJoinModal && (
        <Modal
          title="Join Room"
          onClose={() => setShowJoinModal(false)}
        >
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm mb-2">
                <Translate value="peer.enterRoomCode" />
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full p-2 rounded border dark:bg-gray-800"
                placeholder="Enter room code"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-2">
                <Translate value="peer.enterUsername" />
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 rounded border dark:bg-gray-800"
                placeholder="Enter username"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleJoinRoom}>
                <Translate value="peer.join" />
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default PeerList 
