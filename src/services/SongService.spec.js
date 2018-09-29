// @flow

import DummyRepository from '../repositories/DummyRepository'
import SongService from './SongService'

describe('SongService', () => {
  it('should handle search', () => {
    const dummyRepository = new DummyRepository()
    const songService = new SongService(dummyRepository)

    expect.assertions(2)
    expect(songService.search('AC/DC')).toBeInstanceOf(Promise)
    songService.search('AC/DC').then((result) => {
      expect(result).toEqual([{title: 'Highway to hell'}])
    })
  })
})
