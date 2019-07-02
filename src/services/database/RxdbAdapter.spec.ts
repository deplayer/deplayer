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
      schemaHash: "c032ef9335fd662e02c739ced84d74ac",
      docs: []
    }

    expect.assertions(1)
    const result = await rxdbAdapter.importCollection('media', data)
    expect(result).toBeDefined()
  })
})
