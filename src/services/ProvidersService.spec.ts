import { describe, it, expect } from 'vitest'
import ProvidersService from './ProvidersService'

describe('ProvidersService', () => {
  it('should handle search against all providers', () => {
    const config = {
      providers: {
        dummy0: {
          enabled: true,
        }
      },
      app: {}
    }
    const providersService = new ProvidersService(config)

    expect.assertions(2)

    const promises = providersService.search('highway to hell')
    return Promise.all(promises)
      .then((results) => {
        expect(results).toBeDefined()
        expect(results[0][0].title).toBeDefined()
      })
  })
})
