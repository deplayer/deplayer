// @flow

import * as types from '../constants/ActionTypes'
import { Action } from 'redux'

type State = {
  rows: any,
  totalRows: number,
  visibleSongs: Array<string>,
}

const defaultState = {
  rows: {},
  totalRows: 0,
  visibleSongs: [],
}

export default (state: State = defaultState, action: Action = {}) => {
  switch (action.type) {
    case types.ADD_TO_COLLECTION: {
      const rows = {}
      action.data.forEach((row) => {
        rows[row.id] = row
      })
      return {
        ...state,
        rows,
        totalRows: action.data.length,
      }
    }

    default:
      return state
  }
}
