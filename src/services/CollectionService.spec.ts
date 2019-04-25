import CollectionService from './CollectionService'
import DummyAdapter from './database/DummyAdapter'
import Song from '../entities/Song'

describe('CollectionService', () => {
  it('should handle save', () => {
    const collectionService = new CollectionService(new DummyAdapter())

    expect.assertions(1)

    collectionService.save('123', {mySetting: 'value'})
      .then((result) => {
        expect(result).toBeDefined()
      })
  })

  it('should handle bulkSave', async () => {
    const collectionService = new CollectionService(new DummyAdapter())

    const song = new Song({forceId: 'test', thumbnailUrl: 'test.png'})

    const result = await collectionService.bulkSave([song], {rows: []})

    expect(result).toBeDefined()
  })
})
