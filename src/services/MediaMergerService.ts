import merge from 'deepmerge'

import Media from '../entities/Media'

// TODO: Review the need of this util
export default class MediaMergerService {
  mediaA: Media
  mediaB: Media

  constructor(mediaA: Media, mediaB: Media) {
    this.mediaA = mediaA
    this.mediaB = mediaB
  }

  getMerged(): Media {
    const mergeStream = (streamA: any, streamB: any) => {
      const concatStreams = { ...streamA, ...streamB }
      return Object.values(concatStreams).filter((elem: any, index: number) => {
        const prev = concatStreams[index - 1]

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
