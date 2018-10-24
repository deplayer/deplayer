// @flow

import ProvidersService from './ProvidersService'

describe('ProvidersService', () => {
  it('should handle search against all providers', () => {
    const config = {
      providers: {
        dummy: {
          enabled: true
        }
      }
    }
    const providersService = new ProvidersService(config)

    expect.assertions(2)

    providersService.search('highway to hell')
      .then((results) => {
        expect(results).toBeDefined()
        expect(results[0].title).toBeDefined()
      })
  })
})
