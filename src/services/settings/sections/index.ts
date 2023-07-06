import Lastfm from './Lastfm'
import DatabaseSync from './DatabaseSync'
import IpfsSettings from './IpfsSettings'
import YoutubeDlServer from './YoutubeDlServer'

export default {
  databaseSync: new DatabaseSync(),
  lastfm: new Lastfm(),
  ipfsSettings: new IpfsSettings(),
  youtubeDlServer: new YoutubeDlServer(),
}
