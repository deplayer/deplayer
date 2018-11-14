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

export default (state: State = defaultState, action: Action = {}) => {
  switch (action.type) {
    case types.RECEIVE_COLLECTION: {
      const rows = {}
      action.data.forEach((row) => {
        rows[row.id] = row
      })
      return {
        ...state,
        rows: {...state.rows, ...rows},
        totalRows: state.totalRows + action.data.length,
      }
    }

    default:
      return state
  }
}
