import { useMemo } from 'react'

export type FeaturedReason =
  | 'message.featuredFromLibrary'
  | 'message.featuredFromSmart'
  | 'message.featuredFromGenre'

export type FeaturedPick = {
  playlist: {
    _id: string
    id?: string
    name?: string
    trackIds: string[]
    filters?: Record<string, string[]>
  }
  reasonKey: FeaturedReason
} | null

type Playlist = {
  _id: string
  id?: string
  name?: string
  trackIds: string[]
  filters?: Record<string, string[]>
}

// Pick the playlist to feature in the hero. Preference order:
// 1) Longest personal playlist (proxy for "most loved")
// 2) Longest smart playlist
// 3) Longest genre group
// Each branch returns a reasonKey so the hero can explain itself honestly.
export function usePickFeatured(
  personal: Playlist[],
  smart: Playlist[],
  genre: Playlist[]
): FeaturedPick {
  return useMemo(() => {
    const byLength = (a: Playlist, b: Playlist) => b.trackIds.length - a.trackIds.length

    const topPersonal = [...personal].sort(byLength)[0]
    if (topPersonal && topPersonal.trackIds.length > 0) {
      return { playlist: topPersonal, reasonKey: 'message.featuredFromLibrary' }
    }

    const topSmart = [...smart].sort(byLength)[0]
    if (topSmart && topSmart.trackIds.length > 0) {
      return { playlist: topSmart, reasonKey: 'message.featuredFromSmart' }
    }

    const topGenre = [...genre].sort(byLength)[0]
    if (topGenre && topGenre.trackIds.length > 0) {
      return { playlist: topGenre, reasonKey: 'message.featuredFromGenre' }
    }

    return null
  }, [personal, smart, genre])
}
