import merge from 'deepmerge'

import Media from '../entities/Media'
import Song from '../entities/Song'

export default class MediaMergerService {
  mediaA: Media
  mediaB: Media

  constructor(mediaA: Media, mediaB: Media) {
    this.mediaA = mediaA
    this.mediaB = mediaB
  }

  getMerged(): Media {
    const mergeStream = (streamA, streamB) => {
      const concatStreams = [...streamA, ...streamB]
      return concatStreams.filter((elem, index) => {
        const prev = concatStreams[index-1]

        if (!prev) {
          return true
        }

        return prev.service !== elem.service
      })
    }

    const options = {
      customMerge: (key) => {
        if (key === 'stream') {
          return mergeStream
        }
      }
    }
    const merged = merge(this.mediaA, this.mediaB, options)
    return new Song(merged)
  }
}
