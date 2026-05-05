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

    expect(providersService.providers['dummy0']).toBeDefined()

    const promises = providersService.search('highway to hell')
    return Promise.all(promises)
      .then((results) => {
        expect(results).toHaveLength(1)
        expect(results[0]).toEqual([])
      })
  })
})
