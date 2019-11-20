import Spectrum from './Spectrum'
import Lastfm from './Lastfm'
import DatabaseSync from './DatabaseSync'
import IpfsSettings from './IpfsSettings'
import YoutubeDlServer from './YoutubeDlServer'

export default {
  spectrum: new Spectrum(),
  lastfm: new Lastfm(),
  databaseSync: new DatabaseSync(),
  ipfsSettings: new IpfsSettings(),
  youtubeDlServer: new YoutubeDlServer(),
}
