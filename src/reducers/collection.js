const defaultState = {
  rows: [],
  visibleSongsIds: [],
  visibleSongs: [],
  totalRows: 0
}

export default (state = defaultState, action = {}) => {
  switch (action.type) {
    case 'COLLECTION_FETCHED': {
      const visibleSongsIds = action.data.rows.slice(0,10).map((row) => {
        return row.id
      })

      const visibleSongs = action.data.rows.slice(0,10).map((row) => {
        return row.doc
      })

      return {
        ...state,
        visibleSongsIds,
        visibleSongs,
        totalRows: action.data.total_rows,
        rows: action.data.rows,
      }

    }
    default:
      return state
  }
}
