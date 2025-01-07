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
      <h2 className="text-2xl font-bold mb-4 flex items-center justify-between text-base-content">
        Social
        <button onClick={handleCloseRightPanel} className="btn btn-ghost btn-circle btn-sm">
          <Icon icon="faTimes" />
        </button>
      </h2>
      
      <div>
        <p className="text-base-content/70">
          Connect with your friends and share your contents!
        </p>
      </div>

      {showUsernameModal && (
        <div className="fixed inset-0 bg-base-100/50 backdrop-blur flex items-center justify-center">
          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-base-content">Enter Your Username</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const input = e.currentTarget.elements.namedItem('username') as HTMLInputElement
              handleUsernameSubmit(input.value)
            }}>
              <input
                type="text"
                name="username"
                className="input input-bordered w-full"
                placeholder="Enter username"
                autoFocus
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUsernameModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
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