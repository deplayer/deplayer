import elasticlunr from 'elasticlunr'

export default class IndexService {
  index: any

  generateIndexFrom(collection) {
    this.index = elasticlunr(function () {
      this.addField('album')
      this.addField('artistName')
      this.addField('title')
    })

    this.index.saveDocument(false)

    collection.forEach((doc) => {
      this.index.addDoc(doc)
    })


    return this
  }

  search(searchTerm: string) {
    const results = this.index.search(searchTerm)
    return results
  }
}
