// @flow

import DummyRepository from '../repositories/DummyRepository'
import SongService from './SongService'

describe('SongService', () => {
  it('should handle search', () => {
    const dummyRepository = new DummyRepository()
    const songService = new SongService(dummyRepository)

    expect(songService.search('AC\\DC')).toEqual([{title: 'Highway to hell'}])
  })
})
