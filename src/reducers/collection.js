// @flow

import * as types from '../constants/ActionTypes'
import { Action } from 'redux'

type State = {
  rows: any,
  totalRows: number,
  visibleSongs: Array<string>,
}

export const defaultState = {
  rows: {},
  totalRows: 0,
  visibleSongs: [],
}

const getKeys = (rows: any): Array<string> => {
  return Object.keys(rows)
}

export default (state: State = defaultState, action: Action = {}) => {
  switch (action.type) {
    case types.RECEIVE_COLLECTION: {
      const rows = {}
      action.data.forEach((row) => {
        rows[row.id] = row
      })
      const visibleSongs = getKeys(rows)
      return {
        ...state,
        visibleSongs,
        rows: {...state.rows, ...rows},
        totalRows: state.totalRows + action.data.length
      }
    }

    default:
      return state
  }
}
