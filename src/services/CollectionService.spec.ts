import { describe, it, expect } from 'vitest'
import CollectionService from './CollectionService'
import DummyAdapter from './database/DummyAdapter'
import Media from '../entities/Media'
import { mediaParams } from '../entities/Media.spec'

describe('CollectionService', () => {
  it('should handle save', () => {
    const collectionService = new CollectionService(new DummyAdapter())

    expect.assertions(1)

    collectionService.save('123', { mySetting: 'value' })
      .then((result) => {
        expect(result).toBeDefined()
      })
  })

  it('should handle bulkSave', async () => {
    const collectionService = new CollectionService(new DummyAdapter())

    const song = new Media({ ...mediaParams, forcedId: 'test', cover: { thumbnailUrl: 'test.png', fullUrl: '' } })

    const result = await collectionService.bulkSave([song], { rows: [] })

    expect(result).toBeDefined()
  })
})
