import merge from 'deepmerge'

import type { MediaRow, Stream } from '../types/media'

// TODO: Review the need of this util
export default class MediaMergerService {
  mediaA: MediaRow
  mediaB: MediaRow

  constructor(mediaA: MediaRow, mediaB: MediaRow) {
    this.mediaA = mediaA
    this.mediaB = mediaB
  }

  getMerged(): MediaRow {
    const mergeStream = (streamA: Record<string, Stream>, streamB: Record<string, Stream>) => {
      const concatStreams: Record<string, Stream> = { ...streamA, ...streamB }
      return Object.values(concatStreams).filter((elem: Stream, index: number) => {
        const prev = Object.values(concatStreams)[index - 1]

        if (!prev) {
          return true
        }

        return prev.service !== elem.service
      })
    }

    const options = {
      customMerge: (key: string) => {
        if (key === 'stream') {
          return mergeStream
        }
      }
    }

    const merged = merge(this.mediaA, this.mediaB, options)
    return merged
  }
}
