import { createStore, applyMiddleware, compose } from 'redux'
import createSagaMiddleware from 'redux-saga'
import thunk from 'redux-thunk'
import promise from 'redux-promise'
import { createLogger } from 'redux-logger'

import rootReducer from '../reducers'

// Sagas
import searchSaga from '../sagas/search'

export default function configureStore() {
  let middleware = [promise, thunk]

  if (process.env.NODE_ENV !== 'production') {
    const logger = createLogger()
    middleware = [...middleware, logger]
  }

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

  // Instantiate sagaMiddleware
  const sagaMiddleware = createSagaMiddleware()
  // Prepare store with all the middlewares
  const store = createStore(
    rootReducer,
    composeEnhancers(
      applyMiddleware(...middleware, sagaMiddleware)
    )
  )

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextReducer = require('../reducers')
      store.replaceReducer(nextReducer)
    })
  }

  sagaMiddleware.run(searchSaga)

  return store
}
