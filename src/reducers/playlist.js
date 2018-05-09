import * as types from '../constants/ActionTypes'

const defaultState = {
  currentPlaying: {},
  tracks: {}
}

export default (state = defaultState, action = {}) => {
  switch (action.type) {

    case types.SET_CURRENT_PLAYING:
      return {...state, currentPlaying: action.song}

    case types.ADD_TO_PLAYLIST:
      state.tracks[action.song._id] = action.song
      return {...state}

    default:
      return state
  }
}
