import { useMemo } from 'react'
import { useMediaMapForIds } from '../../stores/livestore/hooks'
import type { MediaRow } from '../../types/media'

const PREVIEW_CAP = 12

export type PlaylistStats = {
  firstCover: string | undefined
  albumCount: number
  duration: number
  trackCount: number
}

export function usePlaylistStats(trackIds: string[]): PlaylistStats {
  const previewIds = useMemo(() => trackIds.slice(0, PREVIEW_CAP), [trackIds])
  const mediaMap = useMediaMapForIds(previewIds)

  return useMemo(() => {
    const tracks = previewIds
      .map(id => mediaMap[id] as MediaRow | undefined)
      .filter((t): t is MediaRow => Boolean(t))

    const firstCover = tracks.find(t => t.cover?.thumbnailUrl)?.cover?.thumbnailUrl
    const albumIds = new Set(
      tracks.map(t => t.albumId).filter((id): id is string => Boolean(id))
    )
    // track.duration is stored in milliseconds (see types/media.ts). Convert
    // once here so consumers can format as seconds without each duplicating
    // the divide-by-1000 (previous code dropped the conversion and rendered
    // wildly wrong totals).
    const durationMs = tracks.reduce((acc, t) => acc + (t.duration || 0), 0)
    const duration = Math.round(durationMs / 1000)

    return {
      firstCover,
      albumCount: albumIds.size,
      duration,
      trackCount: trackIds.length,
    }
  }, [previewIds, mediaMap, trackIds.length])
}
