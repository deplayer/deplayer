import RxdbAdapter from './RxdbAdapter'
import DummyAdapter from './DummyAdapter'

// Returns adapter depending on environment
export const getAdapter = () => {
  return process.env.NODE_ENV === 'test' ? DummyAdapter : RxdbAdapter
}
