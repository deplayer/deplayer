import Mstream from './Mstream'
import Subsonic from './Subsonic'
import Itunes from './Itunes'
import Ipfs from './Ipfs'
import YoutubeDlServer from './YoutubeDlServer'

export default {
  mstream: new Mstream(),
  subsonic: new Subsonic(),
  itunes: new Itunes(),
  ipfs: new Ipfs(),
  'youtube-dl-server': new YoutubeDlServer()
}
