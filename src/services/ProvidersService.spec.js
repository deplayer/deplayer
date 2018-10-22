// @flow

import ProvidersService from './ProvidersService'

describe('ProvidersService', () => {
  it('should handle search against all providers', () => {
    const config = {
      providers: {
        dummy: {}
      }
    }
    const providersService = new ProvidersService(config)

    expect.assertions(1)

    providersService.search('Dead kennedys')
      .then((result) => {
        expect(result).toBeDefined()
      })
  })
})
