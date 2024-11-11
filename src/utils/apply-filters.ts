import { Filter } from "../reducers/collection";
import type Media from "../entities/Media";

export const applyFilters = (
  rows: { [key: string]: Media },
  filters: Filter,
  initialIds?: string[]
): string[] => {
  const idsToFilter = initialIds || Object.keys(rows);
  return idsToFilter.filter((id) => {
    const media = rows[id];

    // Check genre filters
    if (filters.genres.length > 0) {
      const mediaGenres = Array.isArray(media.genres)
        ? media.genres
        : media.genres
        ? [media.genres]
        : [];
      if (!filters.genres.some((g) => mediaGenres.includes(g))) {
        return false;
      }
    }

    // Check type filters
    if (filters.types.length > 0 && !filters.types.includes(media.type)) {
      return false;
    }

    // Check artist filters
    if (
      filters.artists.length > 0 &&
      !filters.artists.includes(media.artist.id)
    ) {
      return false;
    }

    // Check provider filters
    if (filters.providers.length > 0) {
      const mediaProviders = media.stream ? Object.keys(media.stream) : [];
      if (!filters.providers.some(p => mediaProviders.includes(p))) {
        return false;
      }
    }

    return true;
  });
};
