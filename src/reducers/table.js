import * as types from '../constants/ActionTypes'

const defaultState = {
  data: [],
  total: 0,
  page: 0,
  pages: 0
}

export default (state = defaultState, action = {}) => {
  switch (action.type) {
    case types.FILL_VISIBLE_SONGS_FULLFILLED: {
      return {...state, data: action.data.docs}
    }

    default:
      return state
  }
}
