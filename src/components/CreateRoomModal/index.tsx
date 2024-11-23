import React from 'react'
import { Translate } from 'react-redux-i18n'
import Button from '../common/Button'
import Modal from '../common/Modal'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreateRoom: (roomCode: string, username: string) => void
}

const CreateRoomModal = ({ isOpen, onClose, onCreateRoom }: Props) => {
  const [roomCode, setRoomCode] = React.useState('')
  const [username, setUsername] = React.useState(localStorage.getItem('username') || '')

  const handleCreateRoom = () => {
    if (roomCode.trim()) {
      if (username.trim()) {
        localStorage.setItem('username', username.trim())
      }
      onCreateRoom(roomCode.trim(), username)
      onClose()
      setRoomCode('')
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      title={<Translate value="peer.joinOrCreateRoom" />}
      onClose={onClose}
    >
      <div className="p-4">
        <p className="mb-4">Create a room to share your current playing song with your friends.</p>
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
          <Button onClick={handleCreateRoom}>
            <Translate value="peer.join" />
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default CreateRoomModal 