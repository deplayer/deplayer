import React from 'react'
import { ConnectedRouter } from 'connected-react-router'
import { Provider } from 'react-redux'
import history from '../../store/configureHistory'

const ProviderWrapper = ({ children, store }) => (
  <Provider store={store}>
    <ConnectedRouter history={history} >
      { children }
    </ConnectedRouter>
  </Provider>
)

export default ProviderWrapper
