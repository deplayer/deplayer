import PouchdbAdapter from './PouchdbAdapter'
import DummyAdapter from './DummyAdapter'
import { IAdapter } from './IAdapter'

// Returns adapter depending on environment
export const getAdapter = (): IAdapter => {
  return process.env.NODE_ENV === 'test' ? new DummyAdapter : new PouchdbAdapter
}
