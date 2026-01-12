/**
 * Collection domain types
 * Shared between Redux and LiveStore implementations
 */

/**
 * Filter configuration for media collection
 * Used by Collection view, Playlists, and other filtering components
 */
export type Filter = {
  genres: string[];
  types: string[];
  artists: string[];
  providers: string[];
  favorites: boolean;
};
