import * as types from '../constants/ActionTypes'

import filterSongs from '../utils/filter-songs'
import Song from '../entities/Song'

type State = {
  rows: any,
  searchTerm: string,
  visibleSongs: Array<string>,
  searchResults: Array<string>,
  totalRows: number,
}

export const defaultState = {
  rows: {},
  searchTerm: '',
  visibleSongs: [],
  searchResults: [],
  totalRows: 0
}

export default (state: State = defaultState, action: any = {}) => {
  switch (action.type) {
    case types.SET_SEARCH_TERM: {
      return {
        ...state,
        searchTerm: action.searchTerm
      }
    }

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
        visibleSongs: filterSongs(totalRows, state.searchTerm),
        searchResults: state.searchTerm !== '' ? filterSongs(totalRows, state.searchTerm) : [],
        totalRows: state.totalRows + action.data.length
      }
    }

    default:
      return state
  }
}
