// @flow

import ITunesProvider from './ItunesApiProvider'
import MstreamApiProvider from './MstreamApiProvider'
import SubsonicApiProvider from './SubsonicApiProvider'
import DummyProvider from './DummyProvider'

export default {
  itunes: ITunesProvider,
  mstream: MstreamApiProvider,
  subsonic: SubsonicApiProvider,
  dummy: DummyProvider,
}
