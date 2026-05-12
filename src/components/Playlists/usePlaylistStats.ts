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
    const duration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0)

    return {
      firstCover,
      albumCount: albumIds.size,
      duration,
      trackCount: trackIds.length,
    }
  }, [previewIds, mediaMap, trackIds.length])
}
