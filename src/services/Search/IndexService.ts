import elasticlunr from 'elasticlunr'

import Media from '../../entities/Media'
import logger from '../../utils/logger'

export default class IndexService {
  index: any

  constructor() {
    this.index = elasticlunr()
    this.index.addField('title')
    this.index.addField('artistName')
    this.index.addField('albumName')

    this.index.saveDocument(false)
  }

  generateIndexFrom = (collection: Array<Media>) => {
    collection.forEach((doc) => {
      this.index.addDoc(doc)
    })

    return this
  }

  loadIndex(indexDump: any) {
    // TODO: Handle the empty index comming from client
    if (!indexDump) {
      return this
    }
    logger.log('indexDump', indexDump)
    this.index = elasticlunr.Index.load(indexDump)

    return this
  }

  search(searchTerm: string) {
    const results = this.index.search(searchTerm, {
      fields: {
        albumName: {boost: 3},
        artistName: {boost: 2},
        title: {boost: 1}
      },
      bool: 'AND',
      expand: true
    })
    return results
  }
}
