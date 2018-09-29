// @flow

import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import * as actions from './collection'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('actions', () => {
  it('should create an action to get database collection', () => {
    const expectedAction = [
      {
        "type": "GET_COLLECTION"
      }, {
        "data": {
          "offset": 0,
          "rows": [],
          "total_rows": 0
        },
        "type": "COLLECTION_FETCHED"
      },
      {
        "type": "FILL_VISIBLE_SONGS"
      }
    ]

    const store = mockStore({ rows: [] })

    return store.dispatch(actions.getCollection()).then(() => {
      expect(store.getActions()).toEqual(expectedAction)
    })
  })
})
