// @flux

import { createStore, applyMiddleware, compose } from 'redux'
import createSagaMiddleware from 'redux-saga'
import thunk from 'redux-thunk'
import promise from 'redux-promise'
import { createLogger } from 'redux-logger'
import {
  loadTranslations,
  setLocale,
  syncTranslationWithStore,
} from 'react-redux-i18n'

import translationsObject from '../locales'
import rootReducer from '../reducers'

// Sagas
import searchSaga from '../sagas/search'

export default function configureStore() {
  let middlewares = [promise, thunk]

  if (process.env.NODE_ENV !== 'production') {
    const logger = createLogger()
    middlewares = [...middlewares, logger]
  }

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

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextReducer = require('../reducers')
      store.replaceReducer(nextReducer)
    })
  }

  // Running sagas
  sagaMiddleware.run(searchSaga)

  // Setting up locales
  syncTranslationWithStore(store)
  store.dispatch(loadTranslations(translationsObject))
  store.dispatch(setLocale('en'))

  return store
}
