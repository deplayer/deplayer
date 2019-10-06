import Mstream from './Mstream'
import Subsonic from './Subsonic'
import Itunes from './Itunes'
import Ipfs from './Ipfs'

export default {
  mstream: new Mstream(),
  subsonic: new Subsonic(),
  itunes: new Itunes(),
  ipfs: new Ipfs()
}
