// @flow

import * as types from '../constants/ActionTypes'
import { Action } from 'redux'

type State = {
  rows: Array<any>,
  totalRows: number,
  visibleSongs: Array<any>,
}

const defaultState = {
  rows: [],
  totalRows: 0,
  visibleSongs: [],
}

export default (state: State = defaultState, action: Action = {}) => {
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
