import { Translate } from 'react-redux-i18n'
import { QRCodeSVG } from 'qrcode.react'
import { Dispatch } from 'redux'
import Button from '../common/Button'
import Icon from '../common/Icon'
import Modal from '../common/Modal'
import * as types from '../../constants/ActionTypes'

interface Props {
  isOpen: boolean
  roomCode: string
  onClose: () => void
  dispatch: Dispatch
}

const ShareRoomModal = ({ isOpen, roomCode, onClose, dispatch }: Props) => {
  const handleCopyUrl = () => {
    const shareUrl = `${window.location.origin}/join/${roomCode}`
    navigator.clipboard.writeText(shareUrl)
    dispatch({
      type: types.SEND_NOTIFICATION,
      notification: 'Room URL copied to clipboard',
      level: 'success',
      duration: 2000
    })
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      title="Share Room"
      onClose={onClose}
    >
      <div className="p-4 flex flex-col items-center gap-4">
        <p className="mb-4 text-base-content/80">
          Share this link with your friends to join this room. <br />
          You will be able to share your current playing song with them.
        </p>
        
        <div className="bg-base-100 p-4 rounded-lg">
          <QRCodeSVG 
            value={`${window.location.origin}/join/${roomCode}`}
            size={200}
            includeMargin
          />
        </div>

        <div className="w-full">
          <label className="block text-sm mb-2 text-base-content/70">
            <Translate value="peer.roomLink" />
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={`${window.location.origin}/join/${roomCode}`}
              className="input input-bordered w-full"
            />
            <Button onClick={handleCopyUrl} className="btn btn-primary btn-square">
              <Icon icon="faCopy" />
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ShareRoomModal 