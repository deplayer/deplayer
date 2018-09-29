// @flow

import ItunesApiService from './ItunesApiService'

describe('ItunesApiService', () => {
  it('should handle song search', () => {
    const itunesApiService = new ItunesApiService()
    expect(itunesApiService.search('Bad brains')).to.be.an('array')
  })
})
