import RxdbAdapter from './RxdbAdapter'
import Media from '../../entities/Media'

describe('RxdbAdapter', () => {
  it('should handle save a song', async () => {
    const rxdbAdapter = new RxdbAdapter()
    rxdbAdapter.initialize()

    expect.assertions(1)

    const song = new Media()

    const result = await rxdbAdapter.save('media', '123', song.toDocument())
    expect(result).toBeDefined()
  })

  it('should handle importCollection', async () => {
    const rxdbAdapter = new RxdbAdapter()
    rxdbAdapter.initialize()
    const data = {
      name: "media",
      schemaHash: "e18602d745c6d2afc9095af9d076bee3",
      docs: []
    }

    const result = await rxdbAdapter.importCollection('media', data)
    expect(result).toBeDefined()
  })
})
