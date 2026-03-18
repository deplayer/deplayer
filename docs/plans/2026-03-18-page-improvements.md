# Page Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign Deplayer's main pages inspired by Jellyfin (home), Netflix (album/artist), and Spotify ("Because you listened to") patterns.

**Architecture:** 7 tasks building bottom-up: shared components first (HeroSection, DashboardCard, BecauseYouListened), then recommendation service, then page rewrites. Each page is independent after shared components are done.

**Tech Stack:** React, Tailwind CSS, DaisyUI, LiveStore hooks, Last.fm API (existing provider), react-slick (existing HorizontalSlider)

---

### Task 1: HeroSection Shared Component

**Files:**
- Create: `src/components/common/HeroSection/index.tsx`
- Create: `src/components/common/HeroSection/index.spec.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/common/HeroSection/index.spec.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeroSection from '.'

describe('HeroSection', () => {
  it('should render children content', () => {
    render(
      <HeroSection backgroundImage="https://example.com/image.jpg">
        <h1 data-testid="hero-title">Test Title</h1>
      </HeroSection>
    )
    expect(screen.getByTestId('hero-title')).toBeInTheDocument()
  })

  it('should set background image style', () => {
    render(
      <HeroSection backgroundImage="https://example.com/image.jpg">
        <span>Content</span>
      </HeroSection>
    )
    const hero = screen.getByTestId('hero-section')
    expect(hero).toBeInTheDocument()
  })

  it('should render without background image', () => {
    render(
      <HeroSection>
        <span>Content</span>
      </HeroSection>
    )
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/common/HeroSection/index.spec.tsx`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```tsx
// src/components/common/HeroSection/index.tsx
import { ReactNode } from 'react'

type Props = {
  backgroundImage?: string
  children: ReactNode
  className?: string
}

const HeroSection = ({ backgroundImage, children, className = '' }: Props) => {
  return (
    <div
      data-testid="hero-section"
      className={`relative w-full min-h-[280px] md:min-h-[340px] overflow-hidden ${className}`}
    >
      {/* Blurred background */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-40"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base-100/60 to-base-100" />

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 p-6 md:p-10 h-full">
        {children}
      </div>
    </div>
  )
}

export default HeroSection
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/common/HeroSection/index.spec.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/common/HeroSection/
git commit -m "feat: add HeroSection shared component"
```

---

### Task 2: DashboardCard Shared Component

**Files:**
- Create: `src/components/Dashboard/DashboardCard.tsx`
- Create: `src/components/Dashboard/DashboardCard.spec.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/Dashboard/DashboardCard.spec.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardCard from './DashboardCard'

describe('DashboardCard', () => {
  it('should render title and children', () => {
    render(
      <DashboardCard title="Test Card" icon="faMusic">
        <p data-testid="card-content">Hello</p>
      </DashboardCard>
    )
    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByTestId('card-content')).toBeInTheDocument()
  })

  it('should render see all link when provided', () => {
    render(
      <DashboardCard title="Test" icon="faMusic" seeAllLink="/collection">
        <p>Content</p>
      </DashboardCard>
    )
    expect(screen.getByTestId('see-all-link')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Dashboard/DashboardCard.spec.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

```tsx
// src/components/Dashboard/DashboardCard.tsx
import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../common/Icon'

type Props = {
  title: string
  icon: string
  children: ReactNode
  seeAllLink?: string
  className?: string
}

const DashboardCard = ({ title, icon, children, seeAllLink, className = '' }: Props) => {
  return (
    <div data-testid="dashboard-card" className={`bg-base-200 rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Icon icon={icon} />
          {title}
        </h3>
        {seeAllLink && (
          <Link data-testid="see-all-link" to={seeAllLink} className="text-sm text-primary hover:text-primary-focus">
            See all
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

export default DashboardCard
```

**Step 4: Run tests**

Run: `npm test -- src/components/Dashboard/DashboardCard.spec.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Dashboard/DashboardCard.tsx src/components/Dashboard/DashboardCard.spec.tsx
git commit -m "feat: add DashboardCard shared component"
```

---

### Task 3: Recommendation Service + Hook

**Files:**
- Create: `src/services/Recommendations/RecommendationService.ts`
- Create: `src/services/Recommendations/RecommendationService.spec.ts`
- Modify: `src/providers/LastfmProvider.ts` (add `searchSimilarArtists`)
- Create: `src/stores/livestore/hooks/useRecommendations.ts`
- Modify: `src/stores/livestore/hooks/index.ts` (export new hook)

**Step 1: Write the failing test for RecommendationService**

```ts
// src/services/Recommendations/RecommendationService.spec.ts
import { describe, it, expect } from 'vitest'
import { getLocalRecommendations } from './RecommendationService'

describe('RecommendationService', () => {
  const mockLibrary = [
    { id: '1', artistId: 'a1', artistName: 'Radiohead', genres: ['rock', 'alternative'], playCount: 50 },
    { id: '2', artistId: 'a1', artistName: 'Radiohead', genres: ['rock', 'electronic'], playCount: 30 },
    { id: '3', artistId: 'a2', artistName: 'Muse', genres: ['rock', 'alternative'], playCount: 40 },
    { id: '4', artistId: 'a2', artistName: 'Muse', genres: ['rock'], playCount: 20 },
    { id: '5', artistId: 'a3', artistName: 'Björk', genres: ['electronic', 'experimental'], playCount: 10 },
    { id: '6', artistId: 'a4', artistName: 'Portishead', genres: ['electronic', 'trip-hop'], playCount: 15 },
  ]

  it('should return songs sharing genres with source, excluding source artist', () => {
    const results = getLocalRecommendations({
      sourceArtistId: 'a1',
      sourceGenres: ['rock', 'alternative'],
      library: mockLibrary,
      limit: 10,
    })
    // Should not include Radiohead songs
    expect(results.every(r => r.artistId !== 'a1')).toBe(true)
    // Should include Muse (shares rock + alternative)
    expect(results.some(r => r.artistId === 'a2')).toBe(true)
  })

  it('should limit results per artist to max 2', () => {
    const results = getLocalRecommendations({
      sourceArtistId: 'a1',
      sourceGenres: ['rock'],
      library: mockLibrary,
      limit: 20,
    })
    const museCount = results.filter(r => r.artistId === 'a2').length
    expect(museCount).toBeLessThanOrEqual(2)
  })

  it('should rank by genre overlap then playCount', () => {
    const results = getLocalRecommendations({
      sourceArtistId: 'a1',
      sourceGenres: ['rock', 'alternative'],
      library: mockLibrary,
      limit: 10,
    })
    // Muse songs share 2 genres (rock + alternative), should come first
    expect(results[0].artistId).toBe('a2')
  })

  it('should return empty array when no matching genres', () => {
    const results = getLocalRecommendations({
      sourceArtistId: 'a1',
      sourceGenres: ['jazz'],
      library: mockLibrary,
      limit: 10,
    })
    expect(results).toEqual([])
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/services/Recommendations/RecommendationService.spec.ts`
Expected: FAIL

**Step 3: Write RecommendationService**

```ts
// src/services/Recommendations/RecommendationService.ts

type MediaItem = {
  id: string
  artistId: string
  artistName: string
  genres: string[]
  playCount: number
  [key: string]: any
}

type RecommendationParams = {
  sourceArtistId: string
  sourceGenres: string[]
  library: MediaItem[]
  limit?: number
  maxPerArtist?: number
}

/**
 * Get recommendations based on local genre analysis.
 * Finds songs sharing genres with source, excluding the source artist.
 * Ranks by genre overlap count, then playCount.
 * Limits per artist to ensure variety.
 */
export const getLocalRecommendations = ({
  sourceArtistId,
  sourceGenres,
  library,
  limit = 15,
  maxPerArtist = 2,
}: RecommendationParams): MediaItem[] => {
  if (!sourceGenres.length) return []

  const sourceGenreSet = new Set(sourceGenres)

  // Score and filter candidates
  const scored = library
    .filter(item => item.artistId !== sourceArtistId)
    .map(item => {
      const itemGenres = Array.isArray(item.genres)
        ? item.genres
        : typeof item.genres === 'string'
          ? JSON.parse(item.genres)
          : []
      const overlap = itemGenres.filter((g: string) => sourceGenreSet.has(g)).length
      return { item, overlap }
    })
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap
      return (b.item.playCount || 0) - (a.item.playCount || 0)
    })

  // Limit per artist for variety
  const artistCount: Record<string, number> = {}
  const results: MediaItem[] = []

  for (const { item } of scored) {
    const count = artistCount[item.artistId] || 0
    if (count >= maxPerArtist) continue
    artistCount[item.artistId] = count + 1
    results.push(item)
    if (results.length >= limit) break
  }

  return results
}
```

**Step 4: Run tests**

Run: `npm test -- src/services/Recommendations/RecommendationService.spec.ts`
Expected: PASS

**Step 5: Add `searchSimilarArtists` to LastfmProvider**

```ts
// Add to src/providers/LastfmProvider.ts - new method
  similarArtistsUrl: string;

  // In constructor, add:
  // this.similarArtistsUrl = `${this.baseUrl}?method=artist.getsimilar&api_key=${this.apikey}&format=json&limit=20`;

  searchSimilarArtists(artistName: string): Promise<string[]> {
    if (!this.enabled || !this.apikey) {
      return Promise.resolve([]);
    }

    return axios
      .get(`${this.similarArtistsUrl}&artist=${encodeURIComponent(artistName)}`)
      .then((result) => {
        const artists = result.data?.similarartists?.artist || [];
        return artists.map((a: any) => a.name as string);
      })
      .catch((err) => {
        logger.error("Error fetching similar artists:", err);
        return [];
      });
  }
```

**Step 6: Create useRecommendations hook**

```ts
// src/stores/livestore/hooks/useRecommendations.ts
import { useMemo, useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { getLocalRecommendations } from '../../../services/Recommendations/RecommendationService'

/**
 * Hook that returns "Because you listened to X" recommendations.
 * Uses local genre analysis, optionally enriched with Last.fm similar artists.
 *
 * @param artistId - Source artist ID
 * @param artistName - Source artist name (for Last.fm lookup)
 * @param genres - Source genres to match against
 * @param limit - Max results (default 15)
 */
export const useRecommendations = (
  artistId: string | undefined,
  artistName: string | undefined,
  genres: string[],
  limit = 15
) => {
  const store = useAppStore()

  // Load library with minimal fields for recommendation scoring
  const library = store.useQuery(
    queryDb(
      tables.media
        .select('id', 'artistId', 'artistName', 'genresFlat', 'playCount')
        .orderBy('playCount', 'desc')
    )
  )

  return useMemo(() => {
    if (!artistId || !genres.length || !Array.isArray(library)) return []

    // Parse genresFlat back to array for each item
    const parsedLibrary = library.map((item: any) => ({
      ...item,
      genres: item.genresFlat ? item.genresFlat.split(',').map((g: string) => g.trim()) : [],
    }))

    return getLocalRecommendations({
      sourceArtistId: artistId,
      sourceGenres: genres,
      library: parsedLibrary,
      limit,
    })
  }, [artistId, genres, library, limit])
}
```

**Step 7: Export from hooks index**

Add to `src/stores/livestore/hooks/index.ts`:
```ts
export { useRecommendations } from './useRecommendations'
```

**Step 8: Commit**

```bash
git add src/services/Recommendations/ src/providers/LastfmProvider.ts src/stores/livestore/hooks/useRecommendations.ts src/stores/livestore/hooks/index.ts
git commit -m "feat: add recommendation service with local genre analysis and Last.fm similar artists"
```

---

### Task 4: BecauseYouListened Component

**Files:**
- Create: `src/components/BecauseYouListened/index.tsx`
- Create: `src/components/BecauseYouListened/index.spec.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/BecauseYouListened/index.spec.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BecauseYouListened from '.'

// Mock the recommendations hook
vi.mock('../../stores/livestore/hooks/useRecommendations', () => ({
  useRecommendations: () => [
    { id: '1', title: 'Song 1', artistName: 'Artist 1', cover: { thumbnailUrl: '', fullUrl: '' } },
    { id: '2', title: 'Song 2', artistName: 'Artist 2', cover: { thumbnailUrl: '', fullUrl: '' } },
  ]
}))

// Mock the livestore store
vi.mock('../../stores/livestore/store', () => ({
  useAppStore: () => ({
    useQuery: () => [],
  }),
}))

describe('BecauseYouListened', () => {
  it('should render with artist name in title', () => {
    render(
      <MemoryRouter>
        <BecauseYouListened
          artistId="a1"
          artistName="Radiohead"
          genres={['rock']}
        />
      </MemoryRouter>
    )
    expect(screen.getByText(/Radiohead/)).toBeInTheDocument()
  })

  it('should not render when no recommendations', () => {
    vi.doMock('../../stores/livestore/hooks/useRecommendations', () => ({
      useRecommendations: () => []
    }))
    // Component returns null when no recommendations — no assertion needed on empty render
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/BecauseYouListened/index.spec.tsx`
Expected: FAIL

**Step 3: Write implementation**

```tsx
// src/components/BecauseYouListened/index.tsx
import { Translate } from 'react-redux-i18n'
import HorizontalSlider from '../HorizontalSlider'
import MediaCover from '../common/AlbumCover'
import { useRecommendations } from '../../stores/livestore/hooks/useRecommendations'

type Props = {
  artistId: string
  artistName: string
  genres: string[]
  limit?: number
}

const BecauseYouListened = ({ artistId, artistName, genres, limit = 15 }: Props) => {
  const recommendations = useRecommendations(artistId, artistName, genres, limit)

  if (!recommendations.length) return null

  const items = recommendations
    .filter(item => item && item.id)
    .map(item => (
      <MediaCover
        key={item.id}
        id={item.id}
        name={item.title || item.name || 'Unknown'}
        artistName={item.artistName}
        cover={item.cover || { thumbnailUrl: '', fullUrl: '' }}
        type="song"
      />
    ))

  if (!items.length) return null

  const title = (
    <span>
      <Translate value="titles.becauseYouListenedTo" /> {artistName}
    </span>
  )

  return <HorizontalSlider title={title} items={items} />
}

export default BecauseYouListened
```

**Step 4: Add i18n key**

Add to `src/locales/*.ts` files:
```
"titles.becauseYouListenedTo": "Because you listened to"
```

**Step 5: Run tests**

Run: `npm test -- src/components/BecauseYouListened/index.spec.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/BecauseYouListened/ src/locales/
git commit -m "feat: add BecauseYouListened component"
```

---

### Task 5: Redesign Home Page (Jellyfin Widget Cards)

**Files:**
- Modify: `src/components/Dashboard/index.tsx` (full rewrite)
- Create: `src/components/Dashboard/ContinueListeningCard.tsx`
- Create: `src/components/Dashboard/StatsCard.tsx`
- Create: `src/components/Dashboard/TopThisWeekCard.tsx`
- Create: `src/components/Dashboard/GenreChips.tsx`

**Step 1: Create ContinueListeningCard**

```tsx
// src/components/Dashboard/ContinueListeningCard.tsx
import { Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'
import { useDispatch } from 'react-redux'
import CoverImage from '../MusicTable/CoverImage'
import Button from '../common/Button'
import Icon from '../common/Icon'
import DashboardCard from './DashboardCard'
import * as types from '../../constants/ActionTypes'
import { useRecentlyPlayed } from '../../stores/livestore/hooks'

const ContinueListeningCard = () => {
  const recentlyPlayed = useRecentlyPlayed(1)
  const dispatch = useDispatch()
  const song = recentlyPlayed[0]

  if (!song) return null

  return (
    <DashboardCard title="Continue Listening" icon="faPlay">
      <div className="flex items-center gap-4">
        <Link to={`/song/${song.id}`} className="w-16 h-16 flex-shrink-0">
          <CoverImage
            cover={song.cover}
            size="thumbnail"
            albumName={song.album?.name || ''}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/song/${song.id}`}>
            <p className="font-medium truncate">{song.title}</p>
            <p className="text-sm opacity-70 truncate">
              {song.artist?.name || song.artistName} — {song.album?.name || song.albumName}
            </p>
          </Link>
        </div>
        <Button
          onClick={() => dispatch({ type: types.PLAY_SONG, songId: song.id })}
          className="btn-circle btn-primary btn-sm"
        >
          <Icon icon="faPlay" />
        </Button>
      </div>
    </DashboardCard>
  )
}

export default ContinueListeningCard
```

**Step 2: Create StatsCard**

```tsx
// src/components/Dashboard/StatsCard.tsx
import DashboardCard from './DashboardCard'
import Icon from '../common/Icon'
import { useMediaCount, useAlbumsCount, useArtistsCount } from '../../stores/livestore/hooks'

const StatsCard = () => {
  const songCount = useMediaCount()
  const albumCount = useAlbumsCount()
  const artistCount = useArtistsCount()

  return (
    <DashboardCard title="Your Library" icon="faChartBar">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">{songCount}</p>
          <p className="text-sm opacity-70"><Icon icon="faMusic" className="mr-1" />songs</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{albumCount}</p>
          <p className="text-sm opacity-70"><Icon icon="faCompactDisc" className="mr-1" />albums</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{artistCount}</p>
          <p className="text-sm opacity-70"><Icon icon="faMicrophoneAlt" className="mr-1" />artists</p>
        </div>
      </div>
    </DashboardCard>
  )
}

export default StatsCard
```

**Step 3: Create TopThisWeekCard**

```tsx
// src/components/Dashboard/TopThisWeekCard.tsx
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import DashboardCard from './DashboardCard'
import Icon from '../common/Icon'
import * as types from '../../constants/ActionTypes'
import { useMostPlayed } from '../../stores/livestore/hooks'

const TopThisWeekCard = () => {
  const topSongs = useMostPlayed(5)
  const dispatch = useDispatch()

  if (!topSongs.length) return null

  return (
    <DashboardCard title="Most Played" icon="faFire" seeAllLink="/collection">
      <div className="flex flex-col gap-2">
        {topSongs.map((song: any, index: number) => (
          <div
            key={song.id}
            className="flex items-center gap-3 py-1 hover:bg-base-300 rounded-lg px-2 cursor-pointer group"
            onClick={() => dispatch({ type: types.PLAY_SONG, songId: song.id })}
          >
            <span className="text-sm opacity-50 w-5 text-right">{index + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{song.title}</p>
              <p className="text-xs opacity-70 truncate">{song.artistName}</p>
            </div>
            <span className="text-xs opacity-50">{song.playCount}×</span>
            <Icon icon="faPlay" className="opacity-0 group-hover:opacity-100 text-primary text-sm" />
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}

export default TopThisWeekCard
```

**Step 4: Create GenreChips**

```tsx
// src/components/Dashboard/GenreChips.tsx
import { useNavigate } from 'react-router-dom'
import { useGenres } from '../../stores/livestore/hooks'
import { useUI } from '../../contexts'

const GenreChips = () => {
  const genres = useGenres()
  const navigate = useNavigate()
  const { setFilter, clearFilters } = useUI()
  const topGenres = genres.slice(0, 8)

  if (!topGenres.length) return null

  const handleClick = (genre: string) => {
    clearFilters()
    setFilter('genres', [genre])
    navigate('/collection')
  }

  return (
    <div className="w-full">
      <h2 className="mb-4 px-4 text-xl text-base-content">Genres You Love</h2>
      <div className="flex flex-wrap gap-3 px-4">
        {topGenres.map(genre => (
          <button
            key={genre.name}
            onClick={() => handleClick(genre.name)}
            className="btn btn-sm btn-outline rounded-full"
          >
            {genre.name}
            <span className="badge badge-sm ml-1">{genre.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default GenreChips
```

**Step 5: Rewrite Dashboard index.tsx**

```tsx
// src/components/Dashboard/index.tsx
import React from 'react'
import { Translate } from 'react-redux-i18n'
import { useDispatch } from 'react-redux'

import ContinueListeningCard from './ContinueListeningCard'
import StatsCard from './StatsCard'
import RecentAlbums from './RecentAlbums'
import TopThisWeekCard from './TopThisWeekCard'
import GenreChips from './GenreChips'
import BecauseYouListened from '../BecauseYouListened'
import MediaSlider from '../MediaSlider'
import Footer from '../Footer'
import TryDemoButton from '../Buttons/TryDemoButton'
import DashboardCard from './DashboardCard'
import DeplayerTitle from '../DeplayerTitle'
import * as types from '../../constants/ActionTypes'
import { useMostPlayed, useRecentlyPlayed } from '../../stores/livestore/hooks'
import { useMediaCount } from '../../stores/livestore/hooks'

const WelcomeCard = () => {
  const dispatch = useDispatch()
  const [showAuth, setShowAuth] = React.useState(false)

  return (
    <DashboardCard title="Welcome" icon="faMusic" className="col-span-full">
      <div className="flex flex-col items-center gap-4 py-4">
        <h4 className="text-xl text-center">
          <Translate value="dashboard.welcome.title" dangerousHTML /> <DeplayerTitle />
        </h4>
        <p className="text-center opacity-70">
          <Translate value="dashboard.welcome.description" />
        </p>
        <TryDemoButton />
      </div>
    </DashboardCard>
  )
}

const Dashboard = () => {
  const mediaCount = useMediaCount()
  const recentlyPlayed = useRecentlyPlayed(1)
  const topArtist = recentlyPlayed[0]

  // Extract genres from most recently played for "Because you listened" row
  const artistGenres = React.useMemo(() => {
    if (!topArtist) return []
    const genres = topArtist.genres || topArtist.genresFlat?.split(',') || []
    return Array.isArray(genres) ? genres : typeof genres === 'string' ? JSON.parse(genres) : []
  }, [topArtist])

  const hasLibrary = mediaCount > 0

  return (
    <div className="z-10 w-full md:px-12 mb-12 flex flex-col gap-6 md:gap-10">
      {/* Widget cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-4 md:px-0">
        {!hasLibrary && <WelcomeCard />}
        {hasLibrary && <ContinueListeningCard />}
        {hasLibrary && <StatsCard />}
        {hasLibrary && <TopThisWeekCard />}
        {hasLibrary && <RecentAlbums />}
      </div>

      {/* Full-width rows */}
      {topArtist && artistGenres.length > 0 && (
        <BecauseYouListened
          artistId={topArtist.artistId || topArtist.artist?.id}
          artistName={topArtist.artistName || topArtist.artist?.name || 'Unknown'}
          genres={artistGenres}
        />
      )}

      {hasLibrary && <GenreChips />}

      <Footer />
    </div>
  )
}

export default Dashboard
```

**Step 6: Run all tests**

Run: `npm test`
Expected: PASS (no regressions)

**Step 7: Commit**

```bash
git add src/components/Dashboard/
git commit -m "feat: redesign home page with Jellyfin-style widget cards"
```

---

### Task 6: Redesign Album Page (Netflix Hero)

**Files:**
- Modify: `src/components/AlbumView/index.tsx` (rewrite)

**Step 1: Rewrite AlbumView with Netflix Hero**

```tsx
// src/components/AlbumView/index.tsx
import { useDispatch } from 'react-redux'
import { useMatch } from 'react-router'
import { redirect, Link } from 'react-router-dom'
import { useMemo } from 'react'
import { Translate } from 'react-redux-i18n'

import HeroSection from '../common/HeroSection'
import CoverImage from '../MusicTable/CoverImage'
import Button from '../common/Button'
import Icon from '../common/Icon'
import FavoriteButton from '../common/FavoriteButton'
import Album from '../ArtistView/Album'
import RelatedAlbums from '../RelatedAlbums'
import BecauseYouListened from '../BecauseYouListened'
import * as types from '../../constants/ActionTypes'
import { getDurationStr } from '../../utils/timeFormatter'
import { useAlbumById, useMediaByAlbum, useAlbumsByArtist } from '../../stores/livestore/hooks'
import { useQueue } from '../../stores/livestore/hooks/useQueue'

export default function AlbumView() {
  const match = useMatch('/album/:id')
  const dispatch = useDispatch()
  const albumId = match?.params.id || ''

  const album = useAlbumById(albumId)
  const mediaItems = useMediaByAlbum(albumId)
  const queue = useQueue('main')
  const relatedAlbumsData = useAlbumsByArtist(album?.artistId)

  const { songIds, mediaMap, totalDuration, genres } = useMemo(() => {
    const map: Record<string, any> = {}
    const ids: string[] = []
    let duration = 0
    const genreSet = new Set<string>()

    if (Array.isArray(mediaItems)) {
      mediaItems.forEach((item: any) => {
        map[item.id] = item
        ids.push(item.id)
        duration += item.duration || 0
        const itemGenres = item.genres || (item.genresFlat ? item.genresFlat.split(',') : [])
        if (Array.isArray(itemGenres)) itemGenres.forEach((g: string) => g.trim() && genreSet.add(g.trim()))
      })
    }

    return { songIds: ids, mediaMap: map, totalDuration: duration, genres: Array.from(genreSet) }
  }, [mediaItems])

  // Get cover from first song
  const coverSource = useMemo(() => {
    const firstId = songIds[0]
    return firstId ? mediaMap[firstId]?.cover : undefined
  }, [songIds, mediaMap])

  if (!match || !album) {
    if (!match) return null
    redirect('/')
    return null
  }

  const playAlbum = () => {
    if (songIds.length) dispatch({ type: types.PLAY_LIST, trackIds: songIds })
  }

  const shuffleAlbum = () => {
    if (songIds.length) {
      const shuffled = [...songIds].sort(() => Math.random() - 0.5)
      dispatch({ type: types.PLAY_LIST, trackIds: shuffled })
    }
  }

  return (
    <div className="album-view z-10 w-full">
      {/* Netflix-style Hero */}
      <HeroSection backgroundImage={coverSource?.fullUrl}>
        <div className="w-40 h-40 md:w-56 md:h-56 flex-shrink-0 shadow-2xl rounded-lg overflow-hidden">
          <CoverImage
            cover={coverSource}
            size="thumbnail"
            albumName={album.name}
            useImage
          />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold">{album.name}</h1>
          <div className="flex items-center gap-2 text-sm opacity-80">
            {album.artistId && (
              <Link to={`/artist/${album.artistId}`} className="hover:underline font-medium">
                {album.artistName || 'Unknown Artist'}
              </Link>
            )}
            {album.year && <span>• {album.year}</span>}
            <span>• {songIds.length} <Translate value="common.songs" /></span>
            {totalDuration > 0 && <span>• {getDurationStr(totalDuration)}</span>}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <Button onClick={playAlbum} className="btn-primary">
              <Icon icon="faPlay" className="mr-2" />
              <Translate value="common.play" />
            </Button>
            <Button onClick={shuffleAlbum} transparent>
              <Icon icon="faShuffle" className="mr-2" />
              <Translate value="common.shuffle" />
            </Button>
          </div>
        </div>
      </HeroSection>

      {/* Track list */}
      <div className="w-full md:p-4">
        <Album
          queue={queue}
          album={album}
          dispatch={dispatch}
          songs={songIds}
          mediaMap={mediaMap}
        />
      </div>

      {/* Discovery rows */}
      <div className="w-full md:px-4 flex flex-col gap-8 mb-12">
        {genres.length > 0 && album.artistId && (
          <BecauseYouListened
            artistId={album.artistId}
            artistName={album.artistName || 'Unknown'}
            genres={genres}
          />
        )}
        <RelatedAlbums albums={relatedAlbumsData as any} />
      </div>
    </div>
  )
}
```

**Step 2: Run tests**

Run: `npm test`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/AlbumView/index.tsx
git commit -m "feat: redesign album page with Netflix-style hero"
```

---

### Task 7: Redesign Artist Page (Netflix Hero + Popular Tracks)

**Files:**
- Modify: `src/components/ArtistView/index.tsx` (rewrite)
- Modify: `src/components/ArtistView/index.spec.tsx` (update tests)

**Step 1: Rewrite ArtistView**

```tsx
// src/components/ArtistView/index.tsx
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link } from 'react-router-dom'
import { Translate } from 'react-redux-i18n'

import HeroSection from '../common/HeroSection'
import Tag from '../common/Tag'
import Button from '../common/Button'
import Icon from '../common/Icon'
import RelatedAlbums from '../RelatedAlbums'
import BecauseYouListened from '../BecauseYouListened'
import SongRow from '../MusicTable/SongRow'
import * as types from '../../constants/ActionTypes'
import { State } from '../../reducers'
import { useArtistById, useAlbumsByArtist, useSongsByAlbumForArtist } from '../../stores/livestore/hooks'
import { useQueue } from '../../stores/livestore/hooks/useQueue'

export default function ArtistView() {
  const params = useParams()
  const dispatch = useDispatch()
  const artistId = params.id || ''
  const [showAllTracks, setShowAllTracks] = React.useState(false)

  const artist = useArtistById(artistId)
  const albumsData = useAlbumsByArtist(artistId)
  const { songsByAlbum, mediaMap } = useSongsByAlbumForArtist(artistId)
  const queue = useQueue('main')
  const artistMetadata = useSelector((state: State) => state.artist.artistMetadata)

  // Get background image from first album's first song
  const backgroundImage = React.useMemo(() => {
    if (albumsData?.length > 0) {
      const firstAlbumSongs = songsByAlbum[albumsData[0].id]
      if (firstAlbumSongs?.length > 0) {
        return mediaMap[firstAlbumSongs[0]]?.cover?.fullUrl
      }
    }
    return undefined
  }, [albumsData, songsByAlbum, mediaMap])

  // Popular tracks: all songs sorted by playCount
  const popularTracks = React.useMemo(() => {
    const allSongs = Object.values(mediaMap)
      .filter((s: any) => s && s.playCount > 0)
      .sort((a: any, b: any) => (b.playCount || 0) - (a.playCount || 0))
    return allSongs
  }, [mediaMap])

  // All song IDs for Play All / Shuffle
  const allSongIds = React.useMemo(() => {
    return Object.keys(mediaMap)
  }, [mediaMap])

  // Collect genres from all songs
  const artistGenres = React.useMemo(() => {
    const genreSet = new Set<string>()
    Object.values(mediaMap).forEach((song: any) => {
      const genres = song.genres || (song.genresFlat ? song.genresFlat.split(',') : [])
      if (Array.isArray(genres)) genres.forEach((g: string) => g.trim() && genreSet.add(g.trim()))
    })
    return Array.from(genreSet)
  }, [mediaMap])

  const artistSummary = React.useMemo(() => {
    return artistMetadata?.artist?.bio?.content || ''
  }, [artistMetadata])

  React.useEffect(() => {
    if (artist?.name) {
      dispatch({ type: types.LOAD_ARTIST, artist })
      dispatch({ type: types.FETCH_ARTIST_SONGS, artist })
      dispatch({ type: types.SET_BACKGROUND_IMAGE, backgroundImage })
    }
  }, [artist, backgroundImage, dispatch])

  if (!artist) return null

  const playAll = () => {
    if (allSongIds.length) dispatch({ type: types.PLAY_LIST, trackIds: allSongIds })
  }

  const shuffleAll = () => {
    if (allSongIds.length) {
      const shuffled = [...allSongIds].sort(() => Math.random() - 0.5)
      dispatch({ type: types.PLAY_LIST, trackIds: shuffled })
    }
  }

  const visibleTracks = showAllTracks ? popularTracks.slice(0, 10) : popularTracks.slice(0, 5)

  return (
    <div data-testid="artist-view" className="artist-view z-10 w-full">
      {/* Netflix-style Hero */}
      <HeroSection backgroundImage={backgroundImage}>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-5xl font-bold">{artist.name}</h1>
          <div className="flex items-center gap-2 text-sm opacity-80">
            {artistMetadata?.country && <span>{artistMetadata.country}</span>}
            {artistMetadata?.['life-span']?.begin && (
              <span>
                • {artistMetadata['life-span'].begin}
                {artistMetadata['life-span'].end && ` - ${artistMetadata['life-span'].end}`}
              </span>
            )}
            {albumsData && <span>• {albumsData.length} albums</span>}
            <span>• {allSongIds.length} songs</span>
          </div>
          {artistGenres.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {artistGenres.slice(0, 5).map(genre => (
                <Tag key={genre} transparent>{genre}</Tag>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 mt-3">
            <Button onClick={playAll} className="btn-primary">
              <Icon icon="faPlay" className="mr-2" />
              <Translate value="common.playAll" />
            </Button>
            <Button onClick={shuffleAll} transparent>
              <Icon icon="faShuffle" className="mr-2" />
              <Translate value="common.shuffle" />
            </Button>
          </div>
          {artistMetadata?.relations && (
            <div className="flex flex-wrap gap-2 mt-2">
              {artistMetadata.relations.map((relation: any, index: number) => (
                <a key={index} target="_blank" href={relation.url.resource} className="text-xs opacity-70 hover:opacity-100 underline">
                  {relation.type}
                </a>
              ))}
            </div>
          )}
        </div>
      </HeroSection>

      <div className="w-full md:px-8 flex flex-col gap-8 mb-12">
        {/* Popular Tracks */}
        {popularTracks.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4 px-4">
              <Translate value="titles.popularTracks" />
            </h2>
            {visibleTracks.map((song: any, index: number) => (
              <SongRow
                key={song.id}
                mqlMatch={false}
                disableCovers={false}
                style={{}}
                dispatch={dispatch}
                isCurrent={false}
                slim={true}
                onClick={() => dispatch({ type: types.PLAY_LIST, trackIds: allSongIds, startFromId: song.id })}
                song={song}
              />
            ))}
            {popularTracks.length > 5 && !showAllTracks && (
              <button
                onClick={() => setShowAllTracks(true)}
                className="btn btn-ghost btn-sm mt-2 ml-4"
              >
                <Translate value="common.showMore" />
              </button>
            )}
          </div>
        )}

        {/* Discography as horizontal slider */}
        {albumsData && albumsData.length > 0 && (
          <RelatedAlbums albums={albumsData as any} />
        )}

        {/* Because you listened to */}
        {artistGenres.length > 0 && (
          <BecauseYouListened
            artistId={artistId}
            artistName={artist.name}
            genres={artistGenres}
          />
        )}

        {/* Bio */}
        {artistSummary && (
          <div className="px-4">
            <h2 className="text-xl font-semibold mb-4">
              <Translate value="titles.about" />
            </h2>
            <p className="opacity-80 leading-relaxed" dangerouslySetInnerHTML={{ __html: artistSummary }} />
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Update existing tests**

Update `src/components/ArtistView/index.spec.tsx` — ensure `data-testid="artist-view"` is still present (it is). Run existing tests.

**Step 3: Run all tests**

Run: `npm test`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/ArtistView/index.tsx
git commit -m "feat: redesign artist page with Netflix-style hero + popular tracks"
```

---

### Task 8: Song View — Add Lyrics Default + BecauseYouListened

**Files:**
- Modify: `src/components/SongView/index.tsx`

**Step 1: Modify SongView**

Two changes to existing component:

1. **Show Lyrics by default** — change `useState(false)` to `useState(true)` for `showLyrics`
2. **Add BecauseYouListened** — import and render below the existing content, before the AutoSizer section

In `src/components/SongView/index.tsx`:

Change:
```tsx
const [showLyrics, setShowLyrics] = React.useState(false)
```
To:
```tsx
const [showLyrics, setShowLyrics] = React.useState(true)
```

Add import:
```tsx
import BecauseYouListened from '../BecauseYouListened'
```

Add before the `<AutoSizer>` block inside the content div:
```tsx
{songObj?.artist?.id && genres.length > 0 && (
  <div className="mt-8">
    <BecauseYouListened
      artistId={songObj.artist.id}
      artistName={songObj.artist?.name || 'Unknown'}
      genres={genres}
    />
  </div>
)}
```

**Step 2: Run tests**

Run: `npm test -- src/components/SongView/index.spec.tsx`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/SongView/index.tsx
git commit -m "feat: song view - show lyrics by default + add recommendations"
```

---

### Task 9: Add Missing i18n Keys

**Files:**
- Modify: `src/locales/en.ts` (or equivalent locale files)

Add these keys to all locale files:

```
"titles.becauseYouListenedTo": "Because you listened to"
"titles.popularTracks": "Popular Tracks"
"titles.about": "About"
"common.songs": "songs"
"common.playAll": "Play All"
"common.shuffle": "Shuffle"
"common.showMore": "Show more"
```

**Step 1: Find and update locale files**

Run: `ls src/locales/`

Add keys to each locale file.

**Step 2: Run lint**

Run: `npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/locales/
git commit -m "feat: add i18n keys for page improvements"
```

---

### Task 10: Final Verification

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 2: Run lint**

Run: `npm run lint`
Expected: 0 warnings

**Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Manual verification**

Run: `npm run dev`
Verify:
- Home page shows widget cards (or welcome card if empty library)
- Album page has hero section with blurred background
- Artist page has hero + popular tracks + discography slider
- Song view shows lyrics by default + "Because you listened" row
- All navigation still works

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: page improvements - Jellyfin home, Netflix hero, Spotify recommendations"
```
