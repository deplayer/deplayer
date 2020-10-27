// import RxdbAdapter from './RxdbAdapter'
import PouchdbAdapter from './PouchdbAdapter'
import DummyAdapter from './DummyAdapter'

// Returns adapter depending on environment
export const getAdapter = () => {
  return process.env.NODE_ENV === 'test' ? DummyAdapter : PouchdbAdapter
}
