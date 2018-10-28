// @flow

import ITunesRepository from '../repositories/ItunesApiRepository'
import MstreamApiRepository from '../repositories/MstreamApiRepository'
import SubsonicApiRepository from '../repositories/SubsonicApiRepository'
import DummyRepository from '../repositories/DummyRepository'

export default {
  itunes: ITunesRepository,
  mstream: MstreamApiRepository,
  subsonic: SubsonicApiRepository,
  dummy: DummyRepository,
}
