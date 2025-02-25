import * as types from '../constants/ActionTypes'
import { getAdapter } from '../services/database'
import { store } from '../store/configureStore'
import { AnyAction } from 'redux'
import { ThunkDispatch } from 'redux-thunk'
import { InferModel } from 'drizzle-orm'
import { favorites } from '../schema'

type AppDispatch = ThunkDispatch<typeof store.getState, unknown, AnyAction>
type Favorite = InferModel<typeof favorites>

export const toggleFavorite = (songId: string) => ({
  type: types.TOGGLE_FAVORITE,
  songId
})

export const addToFavorites = (songId: string) => ({
  type: types.ADD_TO_FAVORITES,
  songId
})

export const removeFromFavorites = (songId: string) => ({
  type: types.REMOVE_FROM_FAVORITES,
  songId
})

export const loadFavoritesStart = () => ({
  type: types.LOAD_FAVORITES_START
})

export const loadFavoritesSuccess = (favoriteIds: string[]) => ({
  type: types.LOAD_FAVORITES_SUCCESS,
  favoriteIds
})

export const loadFavoritesError = (error: string) => ({
  type: types.LOAD_FAVORITES_ERROR,
  error
})

export const loadFavorites = () => {
  return async (dispatch: AppDispatch) => {
    dispatch(loadFavoritesStart())
    try {
      const favorites = await getAdapter().getAll('favorites', {}) as Favorite[]
      const favoriteIds = favorites.map(fav => fav.mediaId)
      dispatch(loadFavoritesSuccess(favoriteIds))
    } catch (error) {
      dispatch(loadFavoritesError(error instanceof Error ? error.message : 'Unknown error'))
    }
  }
} 