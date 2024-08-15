import lunr from 'lunr'

import Media from '../../entities/Media'
import logger from '../../utils/logger'

let singleton: IndexService

export class IndexService {
  indexBuilder: lunr.Builder
  index: lunr.Index

  constructor() {
    this.indexBuilder = new lunr.Builder
    this.indexBuilder.field('title')
    this.indexBuilder.field('artistName')
    this.indexBuilder.field('albumName')

    this.index = this.indexBuilder.build()
  }

  generateIndexFrom = (collection: Array<Media>) => {
    collection.forEach((doc) => {
      this.indexBuilder.add(doc)
    })
    this.index = this.indexBuilder.build()

    return this
  }

  loadIndex(indexDump: any) {
    // TODO: Handle the empty index comming from client
    if (!indexDump) {
      return this
    }
    logger.log('indexDump', indexDump)
    this.index = lunr.Index.load(indexDump)

    return this
  }

  search(searchTerm: string) {
    const results = this.index.search(searchTerm)
    return results
  }
}

export default () => {
  if (!singleton) {
    singleton = new IndexService()
  }
  return singleton
}
