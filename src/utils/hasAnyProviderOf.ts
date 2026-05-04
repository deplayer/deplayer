import type { Stream } from '../types/media'

export function hasAnyProviderOf(
  stream: Record<string, Stream>,
  providers: string[]
): boolean {
  const services = Object.values(stream).map((s) => s.service)

  let result = false

  services.forEach((service) => {
    providers.forEach((provider) => {
      if (service.startsWith(provider)) {
        result = true
      }
    })
  })

  return result
}
