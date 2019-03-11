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
