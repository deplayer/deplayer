import RoomList from '../components/RoomList'
import * as types from '../constants/ActionTypes'
import Icon from '../components/common/Icon'
import { Dispatch } from 'redux'
import { useState } from 'react'

interface Props {
  dispatch: Dispatch
}

const Social = ({ dispatch }: Props) => {
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null)

  const handleJoinRoom = (code: string) => {
    const savedUsername = localStorage.getItem('username')
    if (!savedUsername) {
      setPendingRoomCode(code)
      setShowUsernameModal(true)
      return
    }
    
    dispatch({ 
      type: types.JOIN_PEER_ROOM, 
      roomCode: code,
      username: savedUsername
    })
  }

  const handleUsernameSubmit = (username: string) => {
    localStorage.setItem('username', username)
    if (pendingRoomCode) {
      dispatch({
        type: types.JOIN_PEER_ROOM,
        roomCode: pendingRoomCode,
        username
      })
    }
    setShowUsernameModal(false)
    setPendingRoomCode(null)
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

      {showUsernameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">Enter Your Username</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const input = e.currentTarget.elements.namedItem('username') as HTMLInputElement
              handleUsernameSubmit(input.value)
            }}>
              <input
                type="text"
                name="username"
                className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter username"
                autoFocus
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUsernameModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Join Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <RoomList
        onJoinRoom={handleJoinRoom}
      />
    </div>
  )
}

export default Social