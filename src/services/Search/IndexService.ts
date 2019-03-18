import * as elasticlunr from 'elasticlunr'

export default class IndexService {
  index: any

  constructor() {
    this.index = elasticlunr(function () {
      this.addField('title')
      this.addField('artistName')
    }, {
      bool: 'AND'
    })

    this.index.saveDocument(false)
  }

  generateIndexFrom(collection) {
    collection.forEach((doc) => {
      this.index.addDoc(doc)
    })

    return this
  }

  // This don't work because this method is not exposed in library
  loadIndex(indexDump: any) {
    // TODO: Handle the empty index comming
    if (!indexDump) {
      return this
    }
    console.log('indexDump', indexDump)
    this.index = elasticlunr.Index.load(indexDump)

    return this
  }

  search(searchTerm: string) {
    const results = this.index.search(searchTerm, {
      fields: {
        artistName: {boost: 2},
        title: {boost: 1}
      },
      bool: 'AND',
      expand: true
    })
    return results
  }
}
