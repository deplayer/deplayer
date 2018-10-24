// @flow

import ITunesRepository from '../repositories/ItunesApiRepository'
import MstreamApiRepository from '../repositories/MstreamApiRepository'
import DummyRepository from '../repositories/DummyRepository'

export default {
  itunes: ITunesRepository,
  mstream: MstreamApiRepository,
  dummy: DummyRepository,
}
