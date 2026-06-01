import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanup, render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import configureStore from 'redux-mock-store'
import { createHtmlPortalNode } from 'react-reverse-portal'

import PlayerContainer from './PlayerContainer'

// Capture hook arguments so we can prove PlayerContainer subscribes to the
// CURRENT track only, never to the whole queue.
const useMediaByIdCalls: Array<string | null | undefined> = []
const useMediaById = vi.fn((id: string | null | undefined) => {
  useMediaByIdCalls.push(id)
  return id ? { id, title: `t-${id}`, artistName: 'A', albumName: 'AL' } : null
})

type QueueShape = {
  trackIds: string[]
  randomTrackIds: string[]
  currentPlaying: number | null
  repeat: boolean
  shuffle: boolean
}
const defaultQueue: QueueShape = {
  trackIds: [],
  randomTrackIds: [],
  currentPlaying: 0,
  repeat: false,
  shuffle: false,
}
const useQueue = vi.fn<[], QueueShape>(() => defaultQueue)
const useSettings = vi.fn<[], { providers: Record<string, unknown> }>(() => ({ providers: {} }))
vi.mock('../stores/livestore/hooks', () => ({
  useQueue: (...args: unknown[]) => useQueue(...(args as [])),
  useSettings: (...args: unknown[]) => useSettings(...(args as [])),
  useMediaById: (id: string | null | undefined) => useMediaById(id),
}))

vi.mock('../components/Player/PlayerControls', () => ({
  default: (props: { collection: { rows: Record<string, unknown> } }) => (
    <div
      data-testid="player-controls"
      data-row-keys={Object.keys(props.collection.rows).join(',')}
    />
  ),
}))

const mockStore = configureStore([])
const renderPlayer = (playerState: Record<string, unknown> = {}) => {
  cleanup()
  useMediaByIdCalls.length = 0
  const store = mockStore({
    app: {},
    player: { streamUri: null, ...playerState },
  })
  const portal = createHtmlPortalNode()
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <PlayerContainer playerPortal={portal} />
      </MemoryRouter>
    </Provider>,
  )
}

describe('PlayerContainer', () => {
  beforeEach(() => {
    useMediaById.mockClear()
    useQueue.mockClear()
  })
  afterEach(() => cleanup())

  it('does not statically import useMediaMapForIds', () => {
    // Structural guard: re-introducing the full-queue subscription would
    // re-introduce the OOM. Keep this hook out of the always-mounted player.
    const src = readFileSync(
      join(__dirname, 'PlayerContainer.tsx'),
      'utf8',
    )
    expect(src).not.toMatch(/useMediaMapForIds/)
  })

  it('subscribes to the current track only, never to the whole queue', () => {
    const trackIds = Array.from({ length: 10_000 }, (_, i) => `t${i}`)
    useQueue.mockReturnValue({
      trackIds,
      randomTrackIds: [],
      currentPlaying: 42,
      repeat: false,
      shuffle: false,
    })

    const { getByTestId } = renderPlayer()

    // Only one media subscription, anchored on the current index.
    expect(useMediaByIdCalls).toEqual(['t42'])
    expect(getByTestId('player-controls').dataset.rowKeys).toBe('t42')
  })

  it('falls back to last valid id when index briefly goes null and streamUri is live', () => {
    const trackIds = ['a', 'b', 'c']
    useQueue.mockReturnValue({
      trackIds,
      randomTrackIds: [],
      currentPlaying: 1,
      repeat: false,
      shuffle: false,
    })
    cleanup()
    useMediaByIdCalls.length = 0
    const store = mockStore({
      app: {},
      player: { streamUri: 'http://example/stream' },
    })
    const portal = createHtmlPortalNode()
    const tree = (
      <Provider store={store}>
        <MemoryRouter>
          <PlayerContainer playerPortal={portal} />
        </MemoryRouter>
      </Provider>
    )
    const { getByTestId, rerender } = render(tree)
    expect(getByTestId('player-controls').dataset.rowKeys).toBe('b')

    // Index transiently null; streamUri still live -> reuse 'b' instead of {}.
    useQueue.mockReturnValue({
      trackIds,
      randomTrackIds: [],
      currentPlaying: null,
      repeat: false,
      shuffle: false,
    })
    rerender(tree)
    expect(getByTestId('player-controls').dataset.rowKeys).toBe('b')
  })

  it('renders empty rows when no current id and no live stream', () => {
    useQueue.mockReturnValue({
      trackIds: ['a'],
      randomTrackIds: [],
      currentPlaying: null,
      repeat: false,
      shuffle: false,
    })
    const { getByTestId } = renderPlayer({ streamUri: null })
    expect(getByTestId('player-controls').dataset.rowKeys).toBe('')
  })
})
