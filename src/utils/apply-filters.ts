import { Filter } from '../reducers/collection'
import type Media from '../entities/Media'

export const applyFilters = (
  rows: { [key: string]: Media }, 
  filters: Filter
): string[] => {
  return Object.keys(rows).filter(id => {
    const media = rows[id]
    
    // Check genre filters
    if (filters.genres.length > 0) {
      const mediaGenres = media.genres
      if (!filters.genres.some(g => mediaGenres.includes(g))) {
        return false
      }
    }

    // Check type filters
    if (filters.types.length > 0 && !filters.types.includes(media.type)) {
      return false
    }

    // Check artist filters
    if (filters.artists.length > 0 && !filters.artists.includes(media.artist.id)) {
      return false 
    }

    return true
  })
} 