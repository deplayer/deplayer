import * as types from '../constants/ActionTypes'
import { getAdapter } from '../services/database'

export type State = {
  favoriteIds: Set<string>;
  loading: boolean;
  error: string | null;
}

export const defaultState: State = {
  favoriteIds: new Set<string>(),
  loading: false,
  error: null
}

export default (state: State = defaultState, action: any): State => {
  switch (action.type) {
    case types.TOGGLE_FAVORITE:
      const newFavorites = new Set(state.favoriteIds)
      if (newFavorites.has(action.songId)) {
        newFavorites.delete(action.songId)
        // Remove from database
        getAdapter().removeMany('favorites', [{ id: action.songId }])
      } else {
        newFavorites.add(action.songId)
        // Add to database
        getAdapter().save('favorites', action.songId, { mediaId: action.songId })
      }
      return {
        ...state,
        favoriteIds: newFavorites
      }

    case types.ADD_TO_FAVORITES:
      // Add to database
      getAdapter().save('favorites', action.songId, { mediaId: action.songId })
      return {
        ...state,
        favoriteIds: new Set([...state.favoriteIds, action.songId])
      }

    case types.REMOVE_FROM_FAVORITES:
      const updatedFavorites = new Set(state.favoriteIds)
      updatedFavorites.delete(action.songId)
      // Remove from database
      getAdapter().removeMany('favorites', [{ id: action.songId }])
      return {
        ...state,
        favoriteIds: updatedFavorites
      }

    case types.LOAD_FAVORITES_START:
      return {
        ...state,
        loading: true,
        error: null
      }

    case types.LOAD_FAVORITES_SUCCESS:
      return {
        ...state,
        loading: false,
        favoriteIds: new Set(action.favorites.map((fav: any) => fav.mediaId))
      }

    case types.LOAD_FAVORITES_ERROR:
      return {
        ...state,
        loading: false,
        error: action.error
      }

    default:
      return state
  }
} 