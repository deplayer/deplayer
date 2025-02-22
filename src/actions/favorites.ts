import * as types from '../constants/ActionTypes'
import { getAdapter } from '../services/database'
import { store } from '../store/configureStore'
import { AnyAction } from 'redux'
import { ThunkDispatch } from 'redux-thunk'

type AppDispatch = ThunkDispatch<typeof store.getState, unknown, AnyAction>

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

export const loadFavoritesSuccess = (favorites: any[]) => ({
  type: types.LOAD_FAVORITES_SUCCESS,
  favorites
})

export const loadFavoritesError = (error: string) => ({
  type: types.LOAD_FAVORITES_ERROR,
  error
})

export const loadFavorites = () => {
  return async (dispatch: AppDispatch) => {
    dispatch(loadFavoritesStart())
    try {
      const favorites = await getAdapter().getAll('favorites', {})
      dispatch(loadFavoritesSuccess(favorites))
    } catch (error) {
      dispatch(loadFavoritesError(error instanceof Error ? error.message : 'Unknown error'))
    }
  }
} 