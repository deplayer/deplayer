import elasticlunr from 'elasticlunr'

export default class IndexService {
  generateIndexFrom(collection) {
    const index = elasticlunr(function () {
      // then, the normal elasticlunr index initialization
      this.addField('album')
      this.addField('artistName')
      this.addField('title')
    })

    collection.forEach((doc) => {
      index.addDoc(doc)
    })

    const results = index.search("Lagrimas")
    console.log(results)
  }
}
