const defaultState = {
  currentPlaying: {
  },
  tracks: [
    {
      label: 'Test playlist'
    }
  ]
}

export default (state = defaultState, action = {}) => {
  switch (action.type) {
    case 'SET_CURRENT_PLAYING':
      return {...state, currentPlaying: action.song}

    default:
      return state
  }
}
