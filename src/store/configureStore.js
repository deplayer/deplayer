import { createStore, applyMiddleware, compose } from 'redux'
import { routerMiddleware } from 'connected-react-router'
import createSagaMiddleware from 'redux-saga'
import thunk from 'redux-thunk'
import promise from 'redux-promise'
import perflogger from 'redux-perf-middleware';

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
import searchSaga from '../sagas/search'
import playerSaga from '../sagas/player'
import settingsSaga from '../sagas/settings'
import collectionSaga from '../sagas/collection'
import notificationsSaga from '../sagas/notifications'
import queueSaga from '../sagas/queue'
import playlistSaga from '../sagas/playlist'
import mediaSessionSaga from '../sagas/mediaSession'
import connectionSaga from '../sagas/connection'
import titleSaga from '../sagas/title'

// Custom middlewares
import alerts from './middlewares/alerts'

const mql = window.matchMedia(`(min-width: 800px)`)

export default function configureStore() {
  const testingMiddlewares = []

  if (process.env.NODE_ENV === 'development') {
    testingMiddlewares.push(perflogger)
  }

  const middlewares = [
    ...testingMiddlewares,
    promise,
    thunk,
    alerts,
    routerMiddleware(history) // for dispatching history actions
  ]

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

  // Instantiate sagaMiddleware
  const sagaMiddleware = createSagaMiddleware()
  // Prepare store with all the middlewares
  const store = createStore(
    rootReducer(history),
    composeEnhancers(
      applyMiddleware(...middlewares, sagaMiddleware)
    )
  )

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextReducer = require('../reducers')
      store.replaceReducer(nextReducer)
    })
  }

  // Running sagas
  sagaMiddleware.run(playerSaga)
  sagaMiddleware.run(settingsSaga)
  sagaMiddleware.run(searchSaga)
  sagaMiddleware.run(collectionSaga)
  sagaMiddleware.run(notificationsSaga)
  sagaMiddleware.run(queueSaga)
  sagaMiddleware.run(playlistSaga)
  sagaMiddleware.run(titleSaga)
  sagaMiddleware.run(mediaSessionSaga, store)
  sagaMiddleware.run(connectionSaga, store)

  store.dispatch({type: types.INITIALIZE_SETTINGS})
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
