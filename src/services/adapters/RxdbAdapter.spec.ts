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
})
