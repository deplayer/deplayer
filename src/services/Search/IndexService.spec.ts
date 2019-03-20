import IndexService from './IndexService'
import Song from '../../entities/Song'

describe('IndexService', () => {
  it('should handle generateIndex and search', () => {
    const indexService = new IndexService()

    const song1 = new Song({
      title: 'California Uber alles',
      artistName: 'Dead Kennedys test'
    })
    const song2 = new Song({
      title: 'Uber',
      artistName: 'dead kennedys',
      albumName: 'best'
    })

    const index = indexService.generateIndexFrom([song1, song2])
    expect(index.search('Dead kennedys').length).toBe(2)
    expect(index.search('California').length).toBe(1)
    expect(index.search('uber').length).toBe(2)
    expect(index.search('best').length).toBe(1)
  })
})
