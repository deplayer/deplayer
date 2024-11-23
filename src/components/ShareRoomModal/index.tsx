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
      title={<Translate value="peer.shareRoom" />}
      onClose={onClose}
    >
      <div className="p-4 flex flex-col items-center gap-4">
        <p className="mb-4">Share this link with your friends to join this room. <br />You will be able to share your current playing song with them.</p>
        <QRCodeSVG 
          value={`${window.location.origin}/join/${roomCode}`}
          size={200}
          includeMargin
        />

        <div className="w-full">
          <label className="block text-sm mb-2">
            <Translate value="peer.roomLink" />
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={`${window.location.origin}/join/${roomCode}`}
              className="w-full p-2 rounded border dark:bg-gray-800"
            />
            <Button onClick={handleCopyUrl}>
              <Icon icon="faCopy" />
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ShareRoomModal 