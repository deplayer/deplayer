import { Provider } from 'react-redux'
import { Store } from 'redux'

const ProviderWrapper = ({ children, store }: { children: React.ReactNode, store: Store }) => (
  <Provider store={store}>
    {children}
  </Provider>
)

export default ProviderWrapper
