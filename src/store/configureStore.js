// @flux

import { createStore, applyMiddleware, compose } from 'redux'
import createSagaMiddleware from 'redux-saga'
import thunk from 'redux-thunk'
import promise from 'redux-promise'
import { INITIALIZED } from '../constants/ActionTypes'
import {
  loadTranslations,
  setLocale,
  syncTranslationWithStore,
} from 'react-redux-i18n'

import translationsObject from '../locales'
import rootReducer from '../reducers'

// Sagas
import searchSaga from '../sagas/search'
import playerSaga from '../sagas/player'
import settingsSaga from '../sagas/settings'
import collectionSaga from '../sagas/collection'

export default function configureStore() {
  let middlewares = [promise, thunk]

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

  // Instantiate sagaMiddleware
  const sagaMiddleware = createSagaMiddleware()
  // Prepare store with all the middlewares
  const store = createStore(
    rootReducer,
    composeEnhancers(
      applyMiddleware(...middlewares, sagaMiddleware)
    )
  )

  // Setting up locales
  syncTranslationWithStore(store)
  store.dispatch(loadTranslations(translationsObject))
  store.dispatch(setLocale('en'))

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

  store.dispatch({type: INITIALIZED})

  return store
}
