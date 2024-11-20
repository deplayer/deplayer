import { useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import * as types from '../constants/ActionTypes'

const JoinRoom = () => {
  const handleJoinRoom = (code: string) => {
    const username = localStorage.getItem('username') || 'Anonymous'
    dispatch({ 
      type: types.JOIN_PEER_ROOM, 
      roomCode: code,
      username 
    })
  }


  const { id } = useParams()
  const dispatch = useDispatch()

  if (id) {
    handleJoinRoom(id)
  }
}

export default JoinRoom