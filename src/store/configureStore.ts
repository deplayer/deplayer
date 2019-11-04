import { createStore, applyMiddleware, compose } from 'redux'
import { routerMiddleware } from 'connected-react-router'
import createSagaMiddleware from 'redux-saga'
import thunk from 'redux-thunk'
import promise from 'redux-promise'
import perflogger from 'redux-perf-middleware'

import history from './configureHistory'

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
import alerts from './middlewares/alerts'
import exports from './middlewares/exports'

const mql = window.matchMedia(`(min-width: 800px)`)

type StoreState = {}

export default function configureStore() {
  const testingMiddlewares: Array<any> = []

  if (process.env.NODE_ENV === 'development') {
    testingMiddlewares.push(perflogger)
  }

  const middlewares = [
    ...testingMiddlewares,
    promise,
    thunk,
    alerts,
    exports,
    routerMiddleware(history) // for dispatching history actions
  ]

  const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

  // Instantiate sagaMiddleware
  const sagaMiddleware = createSagaMiddleware()
  // Prepare store with all the middlewares
	const store = createStore<StoreState, any, any, any>(
    rootReducer(history),
    composeEnhancers(
      applyMiddleware(...middlewares, sagaMiddleware)
    )
	)

  if ((module as any).hot) {
    // Enable Webpack hot module replacement for reducers
    (module as any).hot.accept('../reducers', () => {
      const nextReducer = require('../reducers')
      store.replaceReducer(nextReducer)
    })
  }

  // Running sagas
  sagaMiddleware.run(rootSaga, store)

  store.dispatch({type: types.INITIALIZE})
  // Set breakpoint matching for responsive utilities
  store.dispatch({type: types.SET_MQL, value: mql.matches})
  mql.addListener(() => {
    store.dispatch({type: types.SET_MQL, value: mql.matches})
  })

  // Setting up locales
  syncTranslationWithStore(store)
  store.dispatch(loadTranslations(translationsObject))
  store.dispatch(setLocale('en'))

  return store
}
