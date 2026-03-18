# Page Improvements Design

Inspired by Netflix, Jellyfin, and Spotify to improve Deplayer's main pages.

## Priorities
- **Music discovery** (primary)
- **Immersive playback** (primary)
- **Social/shared listening** (secondary)

## Pages

### 1. Home Page — Jellyfin Widget Cards

Replace current WelcomeMessage + sliders with a dashboard of widget cards:

**Widget cards (2-column grid on desktop, stacked on mobile):**
- **Continue Listening** — Last played song with cover, progress, Resume/Skip buttons
- **Your Stats** — Song/album/artist counts, total hours listened
- **Recently Added** — Mini horizontal slider of recent albums
- **Live Rooms** — Active rooms with listener count + Create Room button
- **Top This Week** — Numbered list of top 5 most played songs this week
- **Friends Activity** — Peer listening activity feed

**Full-width rows below cards:**
- **"Because you listened to X"** — Recommendation slider (see section 5)
- **Genres You Love** — Genre chips with song counts, clickable to filter collection

**Empty state:** When no library data, show welcome + setup steps inside the Continue Listening card area (preserves current onboarding flow).

### 2. Album Page — Netflix Hero

Replace current plain h2 title with cinematic hero:

- **Hero section**: Blurred album cover as full-width background, album cover image on left, metadata on right (album name, artist link, year, song count, total duration)
- **Action buttons**: Play, Shuffle, Add to Queue, Favorite
- **Gradient fade** from hero into track list
- **Track list**: Numbered table with title, play count, duration, context menu. Grouped by disc number (existing logic preserved)
- **Below tracks**: "Because you listened to [Album]" slider + "More from [Artist]" album slider (existing RelatedAlbums)

### 3. Artist Page — Netflix Hero

Replace current plain h2 + bio dump with cinematic hero:

- **Hero section**: Blurred cover from first album as background. Artist name (large), location + years active, album/song counts in library
- **Action buttons**: Play All, Shuffle, Links dropdown
- **Genre tags** in hero area
- **Popular Tracks**: Top 5 songs by playCount (new section, doesn't exist currently). "Show more" expands to 10
- **Discography**: Horizontal slider of albums (replaces current vertical stacked albums)
- **"Because you listened to [Artist]"**: Recommendation slider
- **Bio**: Moved below discography (currently at top)

Clicking an album in Discography navigates to the Album Page (Netflix hero).

### 4. Song View — Current + Enhancements

Keep existing split layout. Two additions:

- **Lyrics visible by default**: On desktop, show as scrollable panel on right side (replace the button-triggered modal). On mobile, show below metadata. Use existing Lyrics component.
- **"Because you listened to [Song]"**: Add recommendation slider at bottom, before existing RelatedAlbums and sameGenreSongs sliders.

### 5. "Because You Listened" Recommendation Engine

New service: `src/services/Recommendations/RecommendationService.ts`

**Local analysis** (always available):
1. Get genres from current artist/album/song
2. Find other songs in library sharing those genres
3. Rank by: genre overlap count → playCount → recency
4. Group by artist (max 2 songs per artist to ensure variety)
5. Return top 15-25 items

**Last.fm similar artists** (when API key configured):
1. Add `searchSimilarArtists(artistName)` method to existing `LastfmProvider` using `artist.getsimilar` endpoint
2. Cross-reference returned artist names with local library artists
3. Return matching local albums/songs from similar artists
4. Merge with local analysis results, deduplicate

New hook: `useRecommendations(entityType, entityId)` — calls RecommendationService, returns media items for slider.

New component: `src/components/BecauseYouListened/index.tsx` — wrapper around existing HorizontalSlider with "Because you listened to X" title pattern.

### 6. Shared Components

**HeroSection** (`src/components/common/HeroSection/index.tsx`):
- Reusable for both Album and Artist pages
- Props: backgroundImage, children (for content overlay)
- Handles: blurred background, gradient fade, responsive layout

**DashboardCard** (`src/components/Dashboard/DashboardCard.tsx`):
- Reusable card wrapper for home page widgets
- Props: title, icon, children, onSeeAll?

## What's NOT changing
- Player component (bottom bar)
- Collection/MusicTable view
- Sidebar/Topbar/Layout
- Settings/Providers pages
- Queue view
- Existing routing structure
