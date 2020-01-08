export type State = {
  location: {
    pathname: string
  },
  action: string
}

export const defaultState = {
  location: {
    pathname: ''
  },
  action: ''
}

export default (state: State = defaultState, action: any): State => {
  switch (action.type) {
    default:
      return state
  }
}
