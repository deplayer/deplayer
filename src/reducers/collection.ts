import * as types from '../constants/ActionTypes'

import Song from '../entities/Song'

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

export const searchObj = (obj: any, query: RegExp): boolean => {
  for (var key in obj) {
    var value = obj[key]

    if (typeof value === 'object') {
        searchObj(value, query)
    }

    if (query.test(value)) {
      return true
    }
  }

  return false
}

export const filterSongs = (songs: any, term: string) => {
  const keys = getKeys(songs).filter((key) => {
    const song = songs[key]
    const filterTerm = new RegExp(term, 'gim')
    return searchObj(song, filterTerm)
  })
  return keys
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
      const visibleSongs = state.visibleSongs.length ? state.visibleSongs : getKeys(totalRows)
      return {
        ...state,
        rows: totalRows,
        visibleSongs,
        totalRows: state.totalRows + action.data.length
      }
    }

    case types.SEARCH_FINISHED: {
      return {
        ...state,
        visibleSongs: filterSongs(state.rows, action.searchTerm)
      }
    }

    default:
      return state
  }
}
