import Lastfm from './Lastfm'
import YoutubeDlServer from './YoutubeDlServer'

import { ISettingsSection } from './ISettingsSection'

const sections : {[key: string]: ISettingsSection} = {
  lastfm: new Lastfm(),
  youtubeDlServer: new YoutubeDlServer(),
}

export default sections