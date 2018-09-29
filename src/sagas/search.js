// @flow

import { START_SEARCH } from '../constants/ActionTypes'

import { call, put, takeLatest } from 'redux-saga/effects'

function* search(action) {
   try {
      const user = yield call(Api.fetchUser, action.payload.userId);
      yield put({type: "USER_FETCH_SUCCEEDED", user: user});
   } catch (e) {
      yield put({type: "USER_FETCH_FAILED", message: e.message});
   }
}

function* searchSaga() {
  yield takeLatest(START_SEARCH, search)
}

export default searchSaga
