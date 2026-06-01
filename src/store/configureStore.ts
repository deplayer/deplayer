import { configureStore as confStore } from "@reduxjs/toolkit";

import { combineReducers } from "redux";
import createSagaMiddleware from "redux-saga";
import { createBrowserHistory } from "history";
import promise from "redux-promise";
import perflogger from "redux-perf-middleware";
import { createReduxHistoryContext } from "redux-first-history";

import {
  loadTranslations,
  setLocale,
  syncTranslationWithStore,
} from "react-redux-i18n";

import { useUIStore } from "../stores/uiStore";
import translationsObject from "../locales";
import rootReducer from "../reducers";

// Sagas
import rootSaga from "../sagas/rootSaga";

// Custom middlewares
// import exports from './middlewares/exports'
import alerts from "./middlewares/alerts";
import { livestoreMiddleware } from "../middleware/livestore";

const mql = window.matchMedia(`(min-width: 800px)`);
const heightMql = window.matchMedia(`(min-height: 300px)`);

// Create browser history instance
const browserHistory = createBrowserHistory();

// Create redux-first-history context
const { createReduxHistory, routerMiddleware, routerReducer } =
  createReduxHistoryContext({
    history: browserHistory,
    reduxTravelling: true,
    savePreviousLocations: 1,
  });

function configureStore() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const testingMiddlewares: Array<any> = [];

  if (process.env.NODE_ENV === "development") {
    testingMiddlewares.push(perflogger);
  }

  const sagaMiddleware = createSagaMiddleware();

  const middlewares = [
    ...testingMiddlewares,
    promise,
    alerts,
    livestoreMiddleware, // NEW: LiveStore sync middleware
    sagaMiddleware,
    routerMiddleware,
  ];

  // These two middlewares cause slow performance in development
  const disabledMiddlewares = {
    immutableCheck: false,
    serializableCheck: false,
  };

  // Instantiate sagaMiddleware
  // Prepare store with all the middlewares
  const store = confStore({
    reducer: combineReducers({
      router: routerReducer,
      ...rootReducer,
    }),
    devTools: process.env.NODE_ENV !== "production",
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware(disabledMiddlewares).concat(...middlewares),
  });

  // Running sagas
  sagaMiddleware.run(rootSaga, store);

  // Set breakpoint matching for responsive utilities
  useUIStore.getState().setMqlMatch(mql.matches);
  useUIStore.getState().setHeightMqlMatch(heightMql.matches);
  mql.addListener(() => {
    useUIStore.getState().setMqlMatch(mql.matches);
  });
  heightMql.addListener(() => {
    useUIStore.getState().setHeightMqlMatch(heightMql.matches);
  });

  // NOTE: INITIALIZE action is now dispatched from App.tsx after LiveStore is ready
  // This prevents the "Cannot access 'getLiveStoreInstance' before initialization" error
  
  // Setting up locales
  syncTranslationWithStore(store);
  store.dispatch(loadTranslations(translationsObject));
  store.dispatch(setLocale("en"));

  return store;
}

// Create store instance
export const store = configureStore();

// Create history instance after store is created
export const history = createReduxHistory(store);
