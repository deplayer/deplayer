import { configureStore as confStore } from '@reduxjs/toolkit'

import { combineReducers } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { createBrowserHistory } from 'history';
import { thunk } from 'redux-thunk'
import promise from 'redux-promise'
import perflogger from 'redux-perf-middleware'
import { createReduxHistoryContext } from "redux-first-history";

import {
  loadTranslations,
  setLocale,
  syncTranslationWithStore,
} from 'react-redux-i18n'

import * as types from '../constants/ActionTypes'
import translationsObject from '../locales'
import rootReducer from '../reducers'

// Sagas
import rootSaga from '../sagas/rootSaga'

// Custom middlewares
// import exports from './middlewares/exports'
import alerts from './middlewares/alerts'

const mql = window.matchMedia(`(min-width: 800px)`)

const { createReduxHistory, routerMiddleware, routerReducer } = createReduxHistoryContext({
  history: createBrowserHistory(),
  //other options if needed 
});

function configureStore() {
  const testingMiddlewares: Array<any> = []

  if (process.env.NODE_ENV === 'development') {
    testingMiddlewares.push(perflogger)
  }

  const sagaMiddleware = createSagaMiddleware()

  const middlewares = [
    ...testingMiddlewares,
    alerts,
    promise,
    thunk,
    sagaMiddleware,
    routerMiddleware
  ]

  // Instantiate sagaMiddleware
  // Prepare store with all the middlewares
  const store = confStore({
    reducer: combineReducers({ router: routerReducer, ...rootReducer }),
    devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(...middlewares),
  })

  // Running sagas
  sagaMiddleware.run(rootSaga, store)

  // Set breakpoint matching for responsive utilities
  store.dispatch({ type: types.SET_MQL, value: mql.matches })
  mql.addListener(() => {
    store.dispatch({ type: types.SET_MQL, value: mql.matches })
  })

  store.dispatch({ type: types.INITIALIZE })
  // Setting up locales
  syncTranslationWithStore(store)
  store.dispatch(loadTranslations(translationsObject))
  store.dispatch(setLocale('en'))

  return store
}

export const store = configureStore()
export const history = createReduxHistory(store);
