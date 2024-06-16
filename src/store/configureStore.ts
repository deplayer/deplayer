import { configureStore as confStore } from '@reduxjs/toolkit'

import createSagaMiddleware from 'redux-saga'
import { thunk } from 'redux-thunk'
import promise from 'redux-promise'
import perflogger from 'redux-perf-middleware'

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
import exports from './middlewares/exports'
import outerReducer from './outerReducer'

const mql = window.matchMedia(`(min-width: 800px)`)

export default function configureStore() {
  const testingMiddlewares: Array<any> = []

  if (process.env.NODE_ENV === 'development') {
    testingMiddlewares.push(perflogger)
  }

  const sagaMiddleware = createSagaMiddleware()

  const middlewares = [
    ...testingMiddlewares,
    promise,
    thunk,
    exports,
    sagaMiddleware
  ]

  // Instantiate sagaMiddleware
  // Prepare store with all the middlewares
  const reducer = outerReducer(rootReducer)
  const store = confStore({
    reducer: reducer,
    devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(...middlewares),
  })

  // Running sagas
  sagaMiddleware.run(rootSaga, store)

  store.dispatch({ type: types.INITIALIZE })
  // Set breakpoint matching for responsive utilities
  store.dispatch({ type: types.SET_MQL, value: mql.matches })
  mql.addListener(() => {
    store.dispatch({ type: types.SET_MQL, value: mql.matches })
  })

  // Setting up locales
  syncTranslationWithStore(store)
  store.dispatch(loadTranslations(translationsObject))
  store.dispatch(setLocale('en'))

  return store
}
