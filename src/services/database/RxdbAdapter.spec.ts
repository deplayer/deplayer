import RxdbAdapter from './RxdbAdapter'
import Song from '../../entities/Song'

describe('RxdbAdapter', () => {
  it('should handle save a song', async () => {
    const rxdbAdapter = new RxdbAdapter()
    rxdbAdapter.initialize()

    expect.assertions(1)

    const song = new Song()

    const result = await rxdbAdapter.save('media', '123', song.toDocument())
    expect(result).toBeDefined()
  })

  it('should handle importCollection', async () => {
    const rxdbAdapter = new RxdbAdapter()
    rxdbAdapter.initialize()
    const data = {
      name: "media",
      schemaHash: "6558e1d1c742cfa4c6cef2c62df87d94",
      docs: []
    }

    const result = await rxdbAdapter.importCollection('media', data)
    expect(result).toBeDefined()
  })
})
