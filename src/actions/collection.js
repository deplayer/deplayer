import * as types from '../constants/ActionTypes'
import * as db from '../db/collection-store';

export const getVisibleSongsIds = (collection) => {
  return collection.rows.slice(0,10).map((row) => {
    return row.id
  })
}

export const getCollection = () => {
  return (dispatch) => {
    dispatch({type: types.GET_COLLECTION})

    return db.getCollection().then((collection) => {
      dispatch({type: types.COLLECTION_FETCHED, data: collection})
      const visibleSongsIds = getVisibleSongsIds(collection)
      dispatch(fillVisibleSongs(visibleSongsIds))
    })
  }
}

export const fillVisibleSongs = (songsIds) => {
  return (dispatch) => {
    dispatch({type: types.FILL_VISIBLE_SONGS})

    songsIds.forEach((id) => {
      db.getSong(id).then((song) => {
        dispatch({type: types.FILL_VISIBLE_SONG_FULLFILLED, data: song})
      })
    })
  }
}
