import * as types from '../constants/ActionTypes'

const defaultState = {
  rows: [],
  totalRows: 0
}

export default (state = defaultState, action = {}) => {
  switch (action.type) {
    case types.COLLECTION_FETCHED: {
      return {
        ...state,
        totalRows: action.data.total_rows,
        rows: action.data.rows,
      }
    }

    default:
      return state
  }
}
