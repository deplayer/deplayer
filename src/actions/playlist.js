export function setCurrentPlaying(song) {
  return function (dispatch) {
    dispatch({type: 'SET_CURRENT_PLAYING', song})
  }
}
