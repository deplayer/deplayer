import { useState, useEffect, useRef } from 'react'
import { coverImageService } from '../services/CoverImageService'

export function useCoverImage(url: string | undefined): string | undefined {
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined)
  const currentUrlRef = useRef<string | undefined>(undefined)
  const objectUrlRef = useRef<string | undefined>(undefined)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (!url) return

    currentUrlRef.current = url
    const controller = new AbortController()

    coverImageService
      .request(url, controller.signal)
      .then((result) => {
        if (currentUrlRef.current === url) {
          objectUrlRef.current = result
          setObjectUrl(result)
        }
      })
      .catch(() => {
        // Aborted or failed — ignore
      })

    return () => {
      controller.abort()
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = undefined
      }
      forceUpdate(v => v + 1)
    }
  }, [url])

  return url ? objectUrl : undefined
}
