import React from 'react'
import { Translate } from 'react-redux-i18n'
import { QRCodeSVG } from 'qrcode.react'
import Button from '../common/Button'
import Icon from '../common/Icon'
import { PeerStatus } from '../../services/PeerService'

interface Props {
  peers: PeerStatus[]
  currentRoom?: string
  onJoinRoom: (code: string) => void
  onShareStream: (peerId: string) => void
  dispatch: any
}

const PeerList = ({ peers, currentRoom, onJoinRoom, onShareStream }: Props) => {
  const [showJoinModal, setShowJoinModal] = React.useState(false)
  const [roomCode, setRoomCode] = React.useState('')

  const shareUrl = currentRoom ? 
    `${window.location.origin}/join/${currentRoom}` : ''

  return (
    <div className="peer-list p-4">
      {currentRoom ? (
        <div className="share-section mb-4">
          <h3><Translate value="peer.shareRoom" /></h3>
          <div className="flex items-center gap-4">
            <input 
              readOnly 
              value={shareUrl}
              className="p-2 rounded"
            />
            <QRCodeSVG value={shareUrl} size={128} />
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowJoinModal(true)}>
          <Translate value="peer.joinRoom" />
        </Button>
      )}

      <div className="peers-section mt-4">
        <h3><Translate value="peer.connectedPeers" /></h3>
        {peers.map(peer => (
          <div key={peer.peerId} className="peer-item flex items-center justify-between p-2">
            <div>
              <span className="font-bold">{peer.username}</span>
              {peer.currentSong && (
                <span className="ml-2 opacity-70">
                  {peer.isPlaying ? '▶' : '⏸'} {peer.currentSong}
                </span>
              )}
            </div>
            <Button onClick={() => onShareStream(peer.peerId)}>
              <Icon icon="faPlay" className="mr-2" />
              <Translate value="peer.listenAlong" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PeerList 