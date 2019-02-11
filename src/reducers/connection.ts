type State = {
  connected: Boolean
}

export const defaultState = {
  connected: false
}

export default (state: State = defaultState, action) => {
  return state
}
