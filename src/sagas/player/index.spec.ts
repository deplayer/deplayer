import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PlaybackController } from '../../services/PlaybackController'
import type { MediaRow } from '../../types/media'
import * as types from '../../constants/ActionTypes'
import type { CallEffect } from "redux-saga/effects"

// Mock all modules in the saga import chain to avoid triggering configureStore

vi.mock('../../stores/livestore/accessor', () => ({
  getLiveStoreInstance: vi.fn().mockReturnValue(null),
  setLiveStoreInstance: vi.fn(),
}))

vi.mock('../../stores/livestore/schema', () => ({
  tables: {
    queue: { select: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({}) }) }) },
    media: { select: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({}) }) }) },
  },
}))

vi.mock('../../services/PlayerRefService', () => ({
  default: {
    getInstance: vi.fn().mockReturnValue({
      stop: vi.fn(),
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      toggle: vi.fn(),
    }),
  },
}))

const mockPlayCurrent = vi.fn().mockResolvedValue({ status: 'started', songId: 'foo', streamUri: 'http://test.mp3' })

// Mock PlaybackController — the real one needs LiveStore, so we fake it.
// We set _controller on the saga module in beforeEach so handlers find it.
const mockControllerInstance = {
  playCurrent: mockPlayCurrent,
  playList: vi.fn().mockResolvedValue({ status: 'started', songId: '', streamUri: '' }),
  playSong: vi.fn(),
  next: vi.fn(),
  previous: vi.fn(),
  retry: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  toggle: vi.fn(),
}

vi.mock('../../services/PlaybackController', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PlaybackController: vi.fn().mockImplementation(() => mockControllerInstance as any),
  createLiveStorePlaybackDataPort: vi.fn().mockReturnValue({}),
}))

vi.mock('../../services/Song/StreamUriService', () => ({
  getStreamUri: vi.fn(),
}))

vi.mock('../../stores/uiStore', () => ({
  useUIStore: {
    getState: vi.fn().mockReturnValue({
      setBackgroundImage: vi.fn(),
    }),
  },
}))

vi.mock('screenfull', () => ({
  default: { isEnabled: false },
}))


describe('player saga adapter', () => {
  beforeEach(async () => {
    const mod = await import('./index')
    mod._setControllerForTest(mockControllerInstance as unknown as PlaybackController)
    mockPlayCurrent.mockClear()
  })
  it('SET_CURRENT_PLAYING action type makes url and media optional', async () => {
    const { setCurrentPlaying } = await import('./index')

    const saga = setCurrentPlaying({
      type: types.SET_CURRENT_PLAYING,
      songId: 'foo',
    })

    // First yield: call to controller.playCurrent (PUSH_TO_VIEW moved into controller)
    const step1 = saga.next()
    expect((step1.value as CallEffect).type).toBe('CALL')

    saga.next({ status: 'started', songId: 'foo', streamUri: 'http://test.mp3' })
    expect(saga.next().done).toBe(true)
  })

  it('setCurrentPlaying forwards optional url and media to controller', async () => {
    const { setCurrentPlaying } = await import('./index')

    const saga = setCurrentPlaying({
      type: types.SET_CURRENT_PLAYING,
      songId: 'bar',
      media: { id: 'bar', title: 'Bar' } as unknown as MediaRow,
      url: 'peer://self/bar?t=1',
    })

    const step1 = saga.next()
    expect((step1.value as CallEffect).type).toBe('CALL')

    const callFn = (step1.value as CallEffect).payload.fn
    await callFn()

    expect(mockPlayCurrent).toHaveBeenCalledWith('bar', {
      media: { id: 'bar', title: 'Bar' },
      streamUri: 'peer://self/bar?t=1',
    })
  })

  it('handlePlayList forwards the shuffle option to controller.playList', async () => {
    const { handlePlayList } = await import('./index')
    const mockPlayList = mockControllerInstance.playList as ReturnType<typeof vi.fn>

    const saga = handlePlayList({
      type: types.PLAY_LIST,
      trackIds: ['a', 'b'],
      shuffle: true,
    })

    const step1 = saga.next()
    expect((step1.value as CallEffect).type).toBe('CALL')

    await (step1.value as CallEffect).payload.fn()

    expect(mockPlayList).toHaveBeenCalledWith(['a', 'b'], undefined, { shuffle: true })
  })
})
