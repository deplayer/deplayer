import * as types from '../constants/ActionTypes'

import Song from '../entities/Song'
import IndexService from '../services/Search/IndexService'

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

export const filterSongs = (songs: any, term: string) => {
  const songsArray = getKeys(songs).map((key) => {
    return songs[key]
  })

  if (!term || term === '') {
    return songsArray
  }

  // TODO: Save, cache and load index from db
  const indexService = new IndexService()
  const results = indexService
    .generateIndexFrom(songsArray)
    .search(term)

  const mappedResults = results.map((result) => {
    return result.ref
  })

  return mappedResults
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
