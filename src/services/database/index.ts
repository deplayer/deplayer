// import PouchdbAdapter from './PouchdbAdapter'
import PgliteAdapter from './PgliteAdapter'
import DummyAdapter from './DummyAdapter'
import { IAdapter } from './IAdapter'

// Returns adapter depending on environment
export const getAdapter = (): IAdapter => {
  // return process.env.NODE_ENV === 'test' ? new DummyAdapter : new PouchdbAdapter
  return process.env.NODE_ENV === 'test' ? new DummyAdapter : new PgliteAdapter
}
