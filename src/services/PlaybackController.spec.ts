import { describe, it, expect, vi } from 'vitest'
import {
  PlaybackController,
  type PlaybackDataPort,
  type PlaybackTransport,
  type PlaybackQueue,
  PlaybackStoreUnavailableError,
} from './PlaybackController'
import type { MediaRow } from '../types/media'
import type { StreamSource } from './Song/StreamUriService'

// ---------------------------------------------------------------------------
// Test fakes
// ---------------------------------------------------------------------------

function fakeMedia(id: string, overrides?: Partial<MediaRow>): MediaRow {
  return {
    id,
    title: `Song ${id}`,
    artistId: 'artist-1',
    albumId: 'album-1',
    artistName: 'Test Artist',
    albumName: 'Test Album',
    type: 'audio',
    duration: 180,
    playCount: 0,
    track: null,
    discNumber: null,
    stream: { subsonic: { service: 'subsonic', uris: [{ uri: `https://example.com/${id}.mp3` }] } },
    cover: { fullUrl: `https://example.com/${id}.jpg` },
    genres: [],
    externalId: null,
    shareUrl: null,
    filePath: null,
    genresFlat: '',
    providersFlat: 'subsonic',
    ...overrides,
  } as unknown as MediaRow
}

function createFakeDataPort(overrides?: Partial<PlaybackDataPort>): PlaybackDataPort {
  return {
    readQueue: vi.fn().mockResolvedValue(null),
    readMedia: vi.fn().mockResolvedValue(null),
    replaceQueue: vi.fn().mockResolvedValue(undefined),
    shuffleQueue: vi.fn().mockResolvedValue(undefined),
    addNext: vi.fn().mockResolvedValue(undefined),
    select: vi.fn().mockResolvedValue(undefined),
    next: vi.fn().mockResolvedValue(true),
    previous: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function createFakeTransport(overrides?: Partial<PlaybackTransport>): PlaybackTransport {
  return {
    stop: vi.fn(),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    toggle: vi.fn(),
    ...overrides,
  }
}

function createFakeStreamResolver(streamUri = 'https://example.com/resolved.mp3') {
  return vi.fn().mockResolvedValue({ url: streamUri, kind: 'remote' } satisfies StreamSource)
}

function makeController(overrides?: {
  data?: Partial<PlaybackDataPort>
  transport?: Partial<PlaybackTransport>
  streamUri?: string
}) {
  const data = createFakeDataPort(overrides?.data)
  const transport = createFakeTransport(overrides?.transport)
  const dispatch = vi.fn()
  const setBg = vi.fn()
  const resolveStream = createFakeStreamResolver(overrides?.streamUri)

  const ctrl = new PlaybackController({
    data,
    transport,
    dispatch,
    setBackgroundImage: setBg,
    resolveStream,
  })

  return { ctrl, data, transport, dispatch, setBg, resolveStream }
}

function queueState(overrides?: Partial<PlaybackQueue>): PlaybackQueue {
  return {
    trackIds: ['song-1', 'song-2', 'song-3'],
    randomTrackIds: ['song-3', 'song-1', 'song-2'],
    currentPlaying: 0,
    currentTrackId: null,
    shuffle: false,
    repeat: false,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PlaybackController', () => {
  describe('playSong', () => {
    it('stops before queue replacement, emits stream/actions, and calls transport.play()', async () => {
      const song1 = fakeMedia('song-1')
      const q = queueState()
      const { ctrl, data, transport, dispatch, setBg, resolveStream } = makeController()

      // Queue is empty — playSong creates it from contextIds
      vi.mocked(data.readQueue).mockResolvedValueOnce(null)  // ensureInQueue: no queue
      vi.mocked(data.readQueue).mockResolvedValueOnce(q)     // after replaceQueue
      vi.mocked(data.readMedia).mockResolvedValueOnce(song1)

      const result = await ctrl.playSong('song-1', ['song-1', 'song-2'])

      // Stop-before-play: STOP_PLAYING dispatched + transport stopped
      expect(dispatch).toHaveBeenCalledWith({ type: 'STOP_PLAYING' })
      expect(transport.stop).toHaveBeenCalled()

      // Queue created from contextIds
      expect(data.replaceQueue).toHaveBeenCalledWith(['song-1', 'song-2'])

      // Stream resolved
      expect(resolveStream).toHaveBeenCalledWith(song1, 0)

      // Actions emitted
      expect(dispatch).toHaveBeenCalledWith({ type: 'PUSH_TO_VIEW', song: 'song-1' })
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_CURRENT_PLAYING_URL', url: 'https://example.com/resolved.mp3' })
      expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_PLAYER' })

      // Transport started
      expect(transport.play).toHaveBeenCalled()

      // Background image set
      expect(setBg).toHaveBeenCalledWith('https://example.com/song-1.jpg')

      expect(result.status).toBe('started')
      if (result.status === "started") expect(result.songId).toBe('song-1')
    })

    it('repositions existing song in queue', async () => {
      const song1 = fakeMedia('song-1')
      const q = queueState()
      const { ctrl, data, transport, dispatch } = makeController()

      vi.mocked(data.readQueue).mockResolvedValueOnce(q)       // ensureInQueue: queue exists
      vi.mocked(data.readQueue).mockResolvedValueOnce(q)       // after select
      vi.mocked(data.readMedia).mockResolvedValueOnce(song1)

      await ctrl.playSong('song-2', undefined)

      // Song in queue → reposition
      expect(data.select).toHaveBeenCalledWith('song-2')
      expect(dispatch).toHaveBeenCalledWith({ type: 'STOP_PLAYING' })
      expect(transport.stop).toHaveBeenCalled()
    })

    it('inserts absent song with addNext', async () => {
      const song4 = fakeMedia('song-4')
      const q = queueState()
      const { ctrl, data } = makeController()

      vi.mocked(data.readQueue).mockResolvedValueOnce(q)       // ensureInQueue: queue exists, song not in
      vi.mocked(data.readQueue).mockResolvedValueOnce(q)       // after addNext+select
      vi.mocked(data.readMedia).mockResolvedValueOnce(song4)

      await ctrl.playSong('song-4', undefined)

      expect(data.addNext).toHaveBeenCalledWith(['song-4'])
      expect(data.select).toHaveBeenCalledWith('song-4')
    })

    it('resolves the stream from the requested provider index', async () => {
      const song1 = fakeMedia('song-1')
      const q = queueState()
      const { ctrl, data, resolveStream, transport } = makeController()

      vi.mocked(data.readQueue).mockResolvedValueOnce(q)       // ensureInQueue: queue exists, song in queue
      vi.mocked(data.readQueue).mockResolvedValueOnce(q)       // after select
      vi.mocked(data.readMedia).mockResolvedValueOnce(song1)

      const result = await ctrl.playSong('song-1', undefined, { providerIndex: 2 })

      expect(resolveStream).toHaveBeenCalledWith(song1, 2)
      expect(result.status).toBe('started')
      expect(transport.play).toHaveBeenCalled()
    })

    it('revokes the previous blob source when starting a new stream', async () => {
      // jsdom shim: the controller only ever calls revokeObjectURL.
      const urlApi = URL as unknown as { revokeObjectURL?: (url: string) => void }
      if (typeof urlApi.revokeObjectURL !== 'function') urlApi.revokeObjectURL = () => {}
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

      const song1 = fakeMedia('song-1')
      const q = queueState()
      const data = createFakeDataPort({
        readQueue: vi.fn().mockResolvedValue(q),
        readMedia: vi.fn().mockResolvedValue(song1),
      })
      const resolver = vi.fn()
        .mockResolvedValueOnce({ url: 'blob:first', kind: 'blob' } satisfies StreamSource)
        .mockResolvedValueOnce({ url: 'https://example.com/second.mp3', kind: 'remote' } satisfies StreamSource)
      const ctrl = new PlaybackController({
        data,
        transport: createFakeTransport(),
        dispatch: vi.fn(),
        setBackgroundImage: vi.fn(),
        resolveStream: resolver,
      })

      await ctrl.playSong('song-1')
      await ctrl.playSong('song-1')

      expect(revokeSpy).toHaveBeenCalledTimes(1)
      expect(revokeSpy).toHaveBeenCalledWith('blob:first')
      revokeSpy.mockRestore()
    })

    it('releases a blob source superseded before dispatch', async () => {
      const revocations: string[] = []
      Object.defineProperty(URL, 'revokeObjectURL', {
        value: (url: string) => revocations.push(url),
        configurable: true,
        writable: true,
      })

      const song1 = fakeMedia('song-1')
      const q = queueState()
      const data = createFakeDataPort({
        readQueue: vi.fn().mockResolvedValue(q),
        readMedia: vi.fn().mockResolvedValue(song1),
      })
      let resolveFirst!: (source: StreamSource) => void
      const first = new Promise<StreamSource>(resolve => { resolveFirst = resolve })
      const resolver = vi.fn()
        .mockImplementationOnce(() => first)
        .mockResolvedValue({ url: 'https://example.com/second.mp3', kind: 'remote' } satisfies StreamSource)
      const ctrl = new PlaybackController({
        data,
        transport: createFakeTransport(),
        dispatch: vi.fn(),
        setBackgroundImage: vi.fn(),
        resolveStream: resolver,
      })
      const p1 = ctrl.playSong('song-1')

      // Let op1 suspend inside the resolver (generation 1 still current).
      await vi.waitFor(() => {
        expect(resolver).toHaveBeenCalledTimes(1)
      })

      // Bump the generation while op1 is suspended there — the post-resolve
      // superseded branch is the leak-prone one.
      const p2 = ctrl.playSong('song-1')
      resolveFirst({ url: 'blob:slow', kind: 'blob' })
      await Promise.all([p1, p2])

      expect(revocations).toContain('blob:slow')

    })
    it('returns idle for empty songId', async () => {
      const { ctrl } = makeController()

      const result = await ctrl.playSong('', undefined)
      expect(result.status).toBe('idle')
      expect((result as { reason: string }).reason).toBe('missing-media')
    })
  })

  describe('shuffled queue with persisted currentTrackId', () => {
    it('uses persisted currentTrackId over index fallback', async () => {
      const song2 = fakeMedia('song-2')
      // Shuffled queue: randomTrackIds = ['song-3', 'song-1', 'song-2']
      // persisted currentTrackId = 'song-2'
      const { ctrl, data, transport } = makeController()

      // playCurrent resolves via stream, not queue mutation
      vi.mocked(data.readMedia).mockResolvedValueOnce(song2)

      const result = await ctrl.playCurrent('song-2', { media: song2 })

      expect(transport.play).toHaveBeenCalled()
      expect(result.status).toBe('started')
    })
  })

  describe('missing media / missing stream exhausts queue', () => {
    it('advances at most once and returns idle after exhaustion', async () => {
      const q = queueState({ currentPlaying: 1 })
      const q2 = queueState({ currentPlaying: 2, currentTrackId: 'song-3' })
      const { ctrl, data } = makeController()

      // readQueue calls: next() main → tryNextTrack before-next → tryNextTrack after-next
      vi.mocked(data.readQueue).mockResolvedValueOnce(q)    // next() reads queue
      vi.mocked(data.readQueue).mockResolvedValueOnce(q)    // tryNextTrack: before advance
      vi.mocked(data.readQueue).mockResolvedValueOnce(q2)   // tryNextTrack: after advance
      // readMedia calls: startStream → tryNextTrack's startStream
      vi.mocked(data.readMedia).mockResolvedValueOnce(null)  // first song: media missing
      vi.mocked(data.readMedia).mockResolvedValueOnce(null)  // next song: media missing too

      const result = await ctrl.next()

      // next() calls data.next() once for the normal advance, then
      // tryNextTrack calls it again to skip the missing-media track.
      expect(data.next).toHaveBeenCalledTimes(2)

      expect(result.status).toBe('idle')
      expect((result as { reason: string }).reason).toBe('missing-stream')
    })

    it('reports the track actually started after skipping a dead one', async () => {
      const song3 = fakeMedia('song-3')
      const q = queueState({ currentPlaying: 1 })
      const q2 = queueState({ currentPlaying: 2, currentTrackId: 'song-3' })
      const { ctrl, data, dispatch } = makeController()

      vi.mocked(data.readQueue).mockResolvedValueOnce(q)
      vi.mocked(data.readQueue).mockResolvedValueOnce(q)
      vi.mocked(data.readQueue).mockResolvedValueOnce(q2)
      vi.mocked(data.readMedia).mockResolvedValueOnce(null)
      vi.mocked(data.readMedia).mockResolvedValueOnce(song3)

      const result = await ctrl.next()

      expect(result.status).toBe('started')
      const started = dispatch.mock.calls
        .map((c: unknown[]) => c[0] as { type: string; media?: unknown })
        .filter(a => a.type === 'TRACK_STARTED')
      expect(started).toEqual([{ type: 'TRACK_STARTED', media: song3 }])
    })

    it('ends (PLAYBACK_IDLE, no replay) when next() cannot advance past the last track', async () => {
      const { ctrl, data, dispatch, transport } = makeController()
      vi.mocked(data.readQueue).mockResolvedValue(queueState({ currentPlaying: 2, currentTrackId: 'song-3' }))
      vi.mocked(data.readMedia).mockResolvedValue(fakeMedia('song-3'))
      vi.mocked(data.next).mockResolvedValue(false)

      const result = await ctrl.next()

      expect(result).toEqual({ status: 'idle', reason: 'end-of-queue' })
      expect(transport.play).not.toHaveBeenCalled()
      expect(dispatch).toHaveBeenCalledWith({ type: 'PLAYBACK_IDLE' })
    })

    it('does not signal PLAYBACK_IDLE for a superseded request', async () => {
      const { ctrl, data, dispatch } = makeController()
      vi.mocked(data.readQueue).mockResolvedValue(queueState({ currentTrackId: 'song-2' }))
      vi.mocked(data.readMedia).mockResolvedValue(fakeMedia('song-2'))

      const [first, second] = await Promise.all([ctrl.next(), ctrl.next()])

      expect(first).toEqual({ status: 'idle', reason: 'superseded' })
      expect(second.status).toBe('started')
      expect(dispatch).not.toHaveBeenCalledWith({ type: 'PLAYBACK_IDLE' })
    })

    it('does not infinitely loop on missing stream', async () => {
      const media = fakeMedia('song-1')
      const q = queueState()
      const { ctrl, data, resolveStream } = makeController()

      vi.mocked(data.readQueue).mockResolvedValue(q)
      vi.mocked(data.readMedia).mockResolvedValue(media)
      // Stream resolver returns empty
      resolveStream.mockResolvedValue('')

      // Advance → no stream, tries next
      // tryNextTrack → readQueue → next → readQueue → try again
      vi.mocked(data.readQueue).mockResolvedValue(q) // before next
      const q2 = queueState({ currentPlaying: 1, currentTrackId: 'song-2' })
      vi.mocked(data.readQueue).mockResolvedValueOnce(q2) // after next
      vi.mocked(data.readMedia).mockResolvedValueOnce(media) // media found but...
      resolveStream.mockResolvedValueOnce('') // ...stream empty again

      const result = await ctrl.next()

      expect(result.status).toBe('idle')
      expect((result as { reason: string }).reason).toBe('missing-stream')
    })
  })

  describe('playCurrent with peer URL', () => {
    it('uses supplied peer:// URL instead of invoking stream resolver', async () => {
      const media = fakeMedia('song-1')
      const { ctrl, dispatch, transport, resolveStream } = makeController()

      const result = await ctrl.playCurrent('song-1', {
        media,
        streamUri: 'peer://self/song-1?t=123',
      })

      // Stream resolver NOT called
      expect(resolveStream).not.toHaveBeenCalled()

      // URL dispatched directly
      expect(dispatch).toHaveBeenCalledWith({
        type: 'SET_CURRENT_PLAYING_URL',
        url: 'peer://self/song-1?t=123',
      })

      expect(transport.play).toHaveBeenCalled()
      expect(result.status).toBe('started')
      if (result.status === "started") expect(result.streamUri).toBe('peer://self/song-1?t=123')
    })
  })

  describe('retry', () => {
    it('retries with the given provider index', async () => {
      const media = fakeMedia('song-1')
      const { ctrl, resolveStream } = makeController()

      // First playCurrent sets currentSongId internally via startStreamWithMedia
      vi.mocked(ctrl as any).currentSongId = 'song-1'

      // Mock readMedia for retry
      const data = (ctrl as any).data
      vi.mocked(data.readMedia).mockResolvedValueOnce(media)

      const result = await ctrl.retry(1)

      expect(resolveStream).toHaveBeenCalledWith(media, 1)
      expect(result.status).toBe('started')
    })

    it('returns idle when no current song', async () => {
      const { ctrl } = makeController()

      const result = await ctrl.retry(0)
      expect(result.status).toBe('idle')
      expect((result as { reason: string }).reason).toBe('missing-media')
    })

    it('advances the queue when the stream is dead', async () => {
      const media1 = fakeMedia('song-1')
      const media2 = fakeMedia('song-2')
      const q = queueState()
      const q2 = queueState({ currentPlaying: 1, currentTrackId: 'song-2' })
      const { ctrl, data, resolveStream } = makeController()

      vi.mocked(ctrl as any).currentSongId = 'song-1'
      vi.mocked(data.readMedia).mockResolvedValueOnce(media1).mockResolvedValueOnce(media2)
      vi.mocked(data.readQueue).mockResolvedValueOnce(q).mockResolvedValueOnce(q2)
      // First stream (current song) is dead; the next song resolves fine.
      resolveStream.mockResolvedValueOnce({ url: '', kind: 'remote' })

      const result = await ctrl.retry(0)

      expect(data.next).toHaveBeenCalledTimes(1)
      expect(result.status).toBe('started')
      if (result.status === 'started') expect(result.songId).toBe('song-2')
    })

    it('stays idle when the fallback track also has no stream', async () => {
      const media = fakeMedia('song-1')
      const media2 = fakeMedia('song-2')
      const q = queueState()
      const q2 = queueState({ currentPlaying: 1, currentTrackId: 'song-2' })
      const { ctrl, data, resolveStream } = makeController()

      vi.mocked(ctrl as any).currentSongId = 'song-1'
      vi.mocked(data.readMedia).mockResolvedValueOnce(media).mockResolvedValueOnce(media2)
      vi.mocked(data.readQueue).mockResolvedValueOnce(q).mockResolvedValueOnce(q2)
      resolveStream.mockResolvedValue({ url: '', kind: 'remote' })

      const result = await ctrl.retry(0)

      expect(result.status).toBe('idle')
      expect((result as { reason: string }).reason).toBe('missing-stream')
    })
  })

  describe('playList', () => {
    it('returns idle for empty list', async () => {
      const { ctrl } = makeController()

      const result = await ctrl.playList([])
      expect(result.status).toBe('idle')
      expect((result as { reason: string }).reason).toBe('empty-queue')
    })

    it('starts from the first track by default', async () => {
      const song1 = fakeMedia('song-1')
      const { ctrl, data, transport, dispatch } = makeController()
      vi.mocked(data.readMedia).mockResolvedValue(song1)

      const result = await ctrl.playList(['song-1', 'song-2'])

      expect(dispatch).toHaveBeenCalledWith({ type: 'STOP_PLAYING' })
      expect(transport.stop).toHaveBeenCalled()
      expect(data.replaceQueue).toHaveBeenCalledWith(['song-1', 'song-2'])
      expect(result.status).toBe('started')
      if (result.status === "started") expect(result.songId).toBe('song-1')
    })

    it('handles startFromId', async () => {
      const song2 = fakeMedia('song-2')
      const { ctrl, data } = makeController()
      vi.mocked(data.readMedia).mockResolvedValue(song2)

      const result = await ctrl.playList(['song-1', 'song-2', 'song-3'], 'song-2')

      expect(data.replaceQueue).toHaveBeenCalledWith(['song-1', 'song-2', 'song-3'])
      expect(data.select).toHaveBeenCalledWith('song-2')
      expect(result.status).toBe('started')
      if (result.status === "started") expect(result.songId).toBe('song-2')
    })

    it('shuffles the queue when shuffle is requested', async () => {
      const song1 = fakeMedia('song-1')
      const { ctrl, data } = makeController()
      vi.mocked(data.readMedia).mockResolvedValue(song1)

      const result = await ctrl.playList(['song-1', 'song-2', 'song-3'], undefined, { shuffle: true })
      expect(data.replaceQueue).toHaveBeenCalledWith(['song-1', 'song-2', 'song-3'])
      expect(data.shuffleQueue).toHaveBeenCalledTimes(1)
      expect(result.status).toBe('started')
    })
  })

  describe('play/pause/toggle', () => {
    it('delegates to transport', async () => {
      const { ctrl, transport } = makeController()

      await ctrl.play()
      expect(transport.play).toHaveBeenCalled()

      ctrl.pause()
      expect(transport.pause).toHaveBeenCalled()

      ctrl.toggle()
      expect(transport.toggle).toHaveBeenCalled()
    })
  })

  describe('PlaybackStoreUnavailableError', () => {
    it('converts to idle result', async () => {
      const { ctrl, data } = makeController()

      vi.mocked(data.readQueue).mockRejectedValue(new PlaybackStoreUnavailableError())

      const result = await ctrl.next()
      expect(result.status).toBe('idle')
      expect((result as { reason: string }).reason).toBe('store-unavailable')
    })
  })

  describe('rapid row-click race', () => {
    it('second click wins; stale first request does not restore old song', async () => {
      const song1 = fakeMedia('song-1')
      const song2 = fakeMedia('song-2')
      const q = queueState({ trackIds: ['song-1', 'song-2'], currentPlaying: 0 })

      const { ctrl, data, transport, dispatch, resolveStream } = makeController()

      // Both songs are in the queue
      vi.mocked(data.readQueue).mockResolvedValue(q)

      // Both songs have media
      vi.mocked(data.readMedia).mockImplementation((id: string) => {
        if (id === 'song-1') return Promise.resolve(song1)
        if (id === 'song-2') return Promise.resolve(song2)
        return Promise.resolve(null)
      })

      // Defer stream resolution for song-1
      let resolveStream1!: (value: StreamSource) => void
      const stream1Deferred = new Promise<StreamSource>(resolve => { resolveStream1 = resolve })
      const stream2Uri = 'https://example.com/song-2-resolved.mp3'

      resolveStream.mockImplementation((media: MediaRow): Promise<StreamSource> => {
        if (media.id === 'song-1') return stream1Deferred
        return Promise.resolve({ url: stream2Uri, kind: 'remote' })
      })

      // Start song-1 — don't await
      const result1Promise = ctrl.playSong('song-1')

      // Wait for song-1 to reach stream resolution (hanging on deferred promise)
      await vi.waitFor(() => {
        expect(resolveStream).toHaveBeenCalledWith(song1, 0)
      })

      // Now start song-2 before song-1's stream resolves
      const result2Promise = ctrl.playSong('song-2')

      // Resolve song-1's stream
      resolveStream1({ url: 'https://example.com/song-1-resolved.mp3', kind: 'remote' })

      // Await both
      const [result1, result2] = await Promise.all([result1Promise, result2Promise])

      // First request superseded
      expect(result1.status).toBe('idle')
      expect((result1 as { reason: string }).reason).toBe('superseded')

      // Second request wins
      expect(result2.status).toBe('started')
      if (result2.status === 'started') {
        expect(result2.songId).toBe('song-2')
        expect(result2.streamUri).toBe(stream2Uri)
      }

      // Dispatch actions should only reflect song-2
      const dispatchCalls = dispatch.mock.calls
      const urlDispatchArgs = dispatchCalls
        .filter((c: unknown[]) => (c[0] as { type: string }).type === 'SET_CURRENT_PLAYING_URL')
        .map((c: unknown[]) => (c[0] as { url: string }).url)
      expect(urlDispatchArgs).not.toContain(expect.stringContaining('song-1'))
      expect(urlDispatchArgs).toContain(stream2Uri)

      // transport.play() called exactly once for the winner
      expect(transport.play).toHaveBeenCalledTimes(1)

      // transport.stop() called twice (once per request)
      expect(transport.stop).toHaveBeenCalledTimes(2)
    })

    it('superseded during queue selection returns idle', async () => {
      const song1 = fakeMedia('song-1')
      const song2 = fakeMedia('song-2')
      const q = queueState({ trackIds: ['song-1', 'song-2'], currentPlaying: 0 })

      const { ctrl, data, transport, resolveStream } = makeController()

      // Queue exists with both songs
      vi.mocked(data.readQueue).mockResolvedValue(q)

      // Defer the select call for song-1
      let resolveSelect1!: () => void
      const select1Deferred = new Promise<void>(resolve => { resolveSelect1 = resolve })
      vi.mocked(data.select).mockImplementation((id: string) => {
        if (id === 'song-1') return select1Deferred
        return Promise.resolve()
      })

      // Media available for both
      vi.mocked(data.readMedia).mockImplementation((id: string) => {
        if (id === 'song-1') return Promise.resolve(song1)
        if (id === 'song-2') return Promise.resolve(song2)
        return Promise.resolve(null)
      })

      resolveStream.mockImplementation((media: MediaRow) =>
        Promise.resolve({ url: `https://example.com/${media.id}-resolved.mp3`, kind: 'remote' })
      )

      // Start song-1
      const result1Promise = ctrl.playSong('song-1')

      // Wait for song-1 to reach the deferred select
      await vi.waitFor(() => {
        expect(data.select).toHaveBeenCalledWith('song-1')
      })

      // Start song-2 before song-1's select resolves
      const result2Promise = ctrl.playSong('song-2')

      // Resolve song-1's select
      resolveSelect1()

      const [result1, result2] = await Promise.all([result1Promise, result2Promise])

      // First request superseded
      expect(result1.status).toBe('idle')
      expect((result1 as { reason: string }).reason).toBe('superseded')

      // Second request wins
      expect(result2.status).toBe('started')
      if (result2.status === 'started') expect(result2.songId).toBe('song-2')

      // transport.play() called exactly once
      expect(transport.play).toHaveBeenCalledTimes(1)
    })
  })
})
