import * as db from '../db/collection-store';

export function getCollection() {
  return function (dispatch) {
    dispatch({type: 'GET_COLLECTION'})

    return db.getCollection().then((collection) => {
      dispatch({type: 'COLLECTION_FETCHED', data: collection})
    })
  }
}

export function fillVisibleSongs(songsIds) {
  return function (dispatch) {
    dispatch({type: 'FILL_VISIBLE_SONGS'})

    return db.getSongs(songsIds).then((songs) => {
      dispatch({type: 'FILL_VISIBLE_SONGS_FULLFILLED', data: songs})
    })
  }
}
