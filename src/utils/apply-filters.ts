import { Filter } from "../types/collection";
import type Media from "../entities/Media";

/**
 * Apply filters to media collection
 * 
 * NOTE: Favorites filtering requires favoriteIds from LiveStore.
 * When not provided, favorites filter will be ignored.
 * The main collection view uses LiveStore's useMedia hook which handles favorites filtering.
 * 
 * TODO: Refactor Playlist.tsx and collection reducer to use LiveStore for all filtering
 */
export const applyFilters = (
  rows: { [key: string]: Media },
  filters: Filter,
  initialIds?: string[],
  favoriteIds?: Set<string>
): string[] => {
  const idsToFilter = initialIds || Object.keys(rows);
  return idsToFilter.filter((id) => {
    const media = rows[id];

    // If no filters are active, include everything
    if (
      filters.genres.length === 0 &&
      filters.types.length === 0 &&
      filters.artists.length === 0 &&
      filters.providers.length === 0 &&
      !filters.favorites
    ) {
      return true;
    }

    let hasMatches = false;

    // Check if media matches any of the selected filters in each active category
    if (filters.genres.length > 0) {
      const mediaGenres = Array.isArray(media.genres)
        ? media.genres
        : media.genres
        ? [media.genres]
        : [];
      if (filters.genres.some((g) => mediaGenres.includes(g))) {
        hasMatches = true;
      }
    }

    if (filters.types.length > 0) {
      if (filters.types.includes(media.type)) {
        hasMatches = true;
      }
    }

    if (filters.artists.length > 0) {
      if (filters.artists.some((artistId) => artistId === media.artist.id)) {
        hasMatches = true;
      }
    }

    if (filters.providers.length > 0) {
      const mediaProviders = media.stream ? Object.keys(media.stream) : [];
      if (filters.providers.some((p) => mediaProviders.includes(p))) {
        hasMatches = true;
      }
    }

    // Favorites filter (requires favoriteIds from LiveStore)
    if (filters.favorites && favoriteIds) {
      if (favoriteIds.has(id)) {
        hasMatches = true;
      }
    }

    return hasMatches;
  });
};
