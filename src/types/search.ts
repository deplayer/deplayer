import * as types from '../constants/ActionTypes'

type SearchType = 'all' | 'artist' | 'album' | 'song'

export interface StartSearchAction {
  type: typeof types.START_SEARCH
  searchTerm: string
  searchType: SearchType
  noRedirect?: boolean
}

export const startSearch = (searchTerm: string, searchType: SearchType = 'all', noRedirect = false): StartSearchAction => ({
  type: types.START_SEARCH,
  searchTerm,
  searchType,
  noRedirect
}) 