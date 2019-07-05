import Spectrum from './Spectrum'
import Lastfm from './Lastfm'
import DatabaseSync from './DatabaseSync'

export default {
  spectrum: new Spectrum(),
  lastfm: new Lastfm(),
  databaseSync: new DatabaseSync()
}
