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
import artistSaga from '../sagas/artist'
import collectionSaga from '../sagas/collection'
import connectionSaga from '../sagas/connection'
import databaseSync from '../sagas/databaseSync'
import mediaSessionSaga from '../sagas/mediaSession'
import notificationsSaga from '../sagas/notifications'
import playerSaga from '../sagas/player'
import playlistSaga from '../sagas/playlist'
import queueSaga from '../sagas/queue'
import searchSaga from '../sagas/search'
import settingsSaga from '../sagas/settings'
import titleSaga from '../sagas/title'

// Custom middlewares
import alerts from './middlewares/alerts'
import exports from './middlewares/exports'

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
    exports,
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
  sagaMiddleware.run(artistSaga)
  sagaMiddleware.run(collectionSaga)
  sagaMiddleware.run(connectionSaga, store)
  sagaMiddleware.run(databaseSync)
  sagaMiddleware.run(mediaSessionSaga, store)
  sagaMiddleware.run(notificationsSaga)
  sagaMiddleware.run(playerSaga)
  sagaMiddleware.run(playlistSaga)
  sagaMiddleware.run(queueSaga)
  sagaMiddleware.run(searchSaga)
  sagaMiddleware.run(settingsSaga)
  sagaMiddleware.run(titleSaga)

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
