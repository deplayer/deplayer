import Lastfm from './Lastfm'
import DatabaseSync from './DatabaseSync'
import IpfsSettings from './IpfsSettings'
import YoutubeDlServer from './YoutubeDlServer'

import { ISettingsSection } from './ISettingsSection'

const sections : {[key: string]: ISettingsSection} = {
  databaseSync: new DatabaseSync(),
  lastfm: new Lastfm(),
  ipfsSettings: new IpfsSettings(),
  youtubeDlServer: new YoutubeDlServer(),
}

export default sections