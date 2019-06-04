import Mstream from './Mstream'
import Subsonic from './Subsonic'
import Itunes from './Itunes'
import Lastfm from './Lastfm'

export default {
  mstream: new Mstream(),
  subsonic: new Subsonic(),
  itunes: new Itunes(),
  lastfm: new Lastfm()
}
