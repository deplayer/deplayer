// @flow

import ItunesApiRepository from './ItunesApiRepository'

describe('ItunesApiService', () => {
  it('should handle song search', () => {
    const itunesRepo = new ItunesApiRepository()
    expect(itunesRepo.search('Bad brains')).toBeInstanceOf(Array)
  })
})
