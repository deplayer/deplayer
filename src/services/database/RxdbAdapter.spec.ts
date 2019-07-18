import RxdbAdapter from './RxdbAdapter'
import Song from '../../entities/Song'

describe('RxdbAdapter', () => {
  it('should handle save a song', async () => {
    const rxdbAdapter = new RxdbAdapter()
    await rxdbAdapter.initialize()

    expect.assertions(1)

    const song = new Song()

    const result = await rxdbAdapter.save('media', '123', song.toDocument())
    expect(result).toBeDefined()
  })

  it('should handle importCollection', async () => {
    const rxdbAdapter = new RxdbAdapter()
    await rxdbAdapter.initialize()
    const data = {
      name: "media",
      schemaHash: "a12564645954362d88bafd117eb7f537",
      docs: []
    }

    expect.assertions(1)
    const result = await rxdbAdapter.importCollection('media', data)
    expect(result).toBeDefined()
  })
})
