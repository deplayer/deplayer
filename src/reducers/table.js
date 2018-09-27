// @flow

import * as types from '../constants/ActionTypes'
import { Action } from 'redux'

type State = {
  data: Array<any>,
  total: number,
  page: number,
  pages: number,
  offset: number
}

const defaultState = {
  data: [],
  total: 0,
  page: 0,
  pages: 0,
  offset: 10
}

export default (state: State = defaultState, action: Action = {}): State => {
  switch (action.type) {
    case types.COLLECTION_FETCHED: {
      return {
        ...state,
        total: action.data.total_rows,
        pages: action.data.total_rows / state.offset
      }
    }

    case types.FILL_VISIBLE_SONGS_FULLFILLED: {
      return {...state, data: action.data}
    }

    case types.FILL_VISIBLE_SONG_FULLFILLED: {
      return {...state, data: [...state.data, action.data]}
    }

    default:
      return state
  }
}
