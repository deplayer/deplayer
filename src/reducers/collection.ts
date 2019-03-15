import * as types from '../constants/ActionTypes'

import Song from '../entities/Song'

type State = {
  rows: any,
  totalRows: number,
}

export const defaultState = {
  rows: {},
  totalRows: 0
}

export default (state: State = defaultState, action: any = {}) => {
  switch (action.type) {
    case types.ADD_TO_COLLECTION:
    case types.RECEIVE_COLLECTION: {
      const rows = {}
      action.data.forEach((row) => {
        rows[row.id] = new Song(row)
      })
      const totalRows = {...state.rows, ...rows}
      return {
        ...state,
        rows: totalRows,
        totalRows: state.totalRows + action.data.length
      }
    }

    default:
      return state
  }
}
