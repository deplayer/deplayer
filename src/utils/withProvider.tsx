import React from 'react'
import Provider from './ProviderWrapper'
import configureStore from '../store/configureStore'

const store = configureStore()

const withProvider = (story: any) => (
  <Provider store={store}>
    { story() }
  </Provider>
)
export default withProvider
