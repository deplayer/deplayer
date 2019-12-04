import Lastfm from './Lastfm'
import DatabaseSync from './DatabaseSync'
import IpfsSettings from './IpfsSettings'
import YoutubeDlServer from './YoutubeDlServer'

export default {
  lastfm: new Lastfm(),
  databaseSync: new DatabaseSync(),
  ipfsSettings: new IpfsSettings(),
  youtubeDlServer: new YoutubeDlServer(),
}
