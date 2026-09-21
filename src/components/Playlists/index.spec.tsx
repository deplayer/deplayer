import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import type { ReactElement } from 'react'

vi.mock('react-redux-i18n', () => ({
  Translate: ({ value }: { value: string }) => value,
}))

const usePlaylists = vi.fn(() => [] as unknown[])
const useSmartPlaylists = vi.fn(() => [] as unknown[])
const useSongsByGenre = vi.fn(() => ({}) as Record<string, string[]>)
const useQueue = vi.fn(() => null)
const useSettings = vi.fn(() => null)
const useMediaCount = vi.fn(() => 0)

vi.mock('../../stores/livestore/hooks', () => ({
  usePlaylists: () => usePlaylists(),
  useSmartPlaylists: () => useSmartPlaylists(),
  useSongsByGenre: () => useSongsByGenre(),
  useQueue: () => useQueue(),
  useSettings: () => useSettings(),
  useMediaCount: () => useMediaCount(),
}))

vi.mock('../../stores/livestore/queue', () => ({
  getActiveTrackIds: () => [],
}))

// Keep the tree light — this suite is about the container's hook order, not
// the children's rendering.
vi.mock('./FeaturedHero', () => ({ default: () => <div data-testid="featured-hero" /> }))
vi.mock('./PlaylistRow', () => ({ default: () => <div data-testid="playlist-row" /> }))
vi.mock('./GenreWall', () => ({ default: () => <div data-testid="genre-wall" /> }))

import Playlists from './index'
import { renderWithProviders } from '../../test-utils/render'

const playlist = (id: string, trackIds: string[]) => ({ id, name: id, trackIds })

/**
 * `Playlists` is `memo`-wrapped with no props, so a re-render with identical
 * props is skipped and the hook-order transition could never be exercised.
 * The extra `tick` prop is ignored by the component but makes memo re-render.
 */
const Instrumented = Playlists as unknown as (props: { tick: number }) => ReactElement

describe('Playlists', () => {
  beforeEach(() => {
    usePlaylists.mockReturnValue([])
    useSmartPlaylists.mockReturnValue([])
    useSongsByGenre.mockReturnValue({})
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows the empty state when there is nothing to show', () => {
    renderWithProviders(<Instrumented tick={0} />)
    expect(screen.queryByTestId('featured-hero')).toBeNull()
    expect(document.body.textContent).toContain('message.noPlaylists')
  })

  it('keeps hook order when the first playlist appears', () => {
    // Regression: usePickFeatured used to be called after the empty-state
    // early return, so the first playlist a user created changed the hook
    // count between renders and React threw "Rendered more hooks than
    // during the previous render".
    const { rerender } = renderWithProviders(<Instrumented tick={0} />)
    expect(screen.queryByTestId('featured-hero')).toBeNull()

    usePlaylists.mockReturnValue([playlist('p1', ['t1'])] as unknown[])
    rerender(<Instrumented tick={1} />)

    expect(screen.getByTestId('featured-hero')).toBeInTheDocument()
  })

  it('keeps hook order when the last playlist disappears', () => {
    usePlaylists.mockReturnValue([playlist('p1', ['t1'])] as unknown[])
    const { rerender } = renderWithProviders(<Instrumented tick={0} />)
    expect(screen.getByTestId('featured-hero')).toBeInTheDocument()

    usePlaylists.mockReturnValue([])
    rerender(<Instrumented tick={1} />)

    expect(screen.queryByTestId('featured-hero')).toBeNull()
    expect(document.body.textContent).toContain('message.noPlaylists')
  })
})
