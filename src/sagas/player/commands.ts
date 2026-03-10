/**
 * Centralized playback command sagas.
 *
 * Every user-initiated playback change flows through one of these handlers.
 * Components dispatch intent actions (PLAY_LIST, PLAY_SONG); these sagas
 * coordinate LiveStore queue mutations and audio lifecycle in a single,
 * race-free sequence:
 *
 *   1. Stop current playback (Redux state + DOM kill-switch)
 *   2. Mutate LiveStore queue
 *   3. Resolve stream URI for the target track
 *   4. Start new playback
 *
 * No component should call LiveStore queue actions directly for playback.
 */
import { call, put } from 'redux-saga/effects'
import * as types from '../../constants/ActionTypes'
import { getLiveStoreInstance } from '../../App'
import {
  playAllAction,
  playMediaAction,
  addNextAction,
} from '../../stores/livestore/actions'
import { getStreamUri } from '../../services/Song/StreamUriService'
import {
  getSongByIdFromLiveStore,
  getSongBgFromLiveStore,
} from '../selectors'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Stop all currently playing audio/video elements in the DOM.
 * Synchronous kill-switch — called before every queue mutation so that
 * LiveStore reactive re-renders never encounter a playing stream.
 */
export function stopAllPlayback() {
  if (typeof document === 'undefined') return
  document.querySelectorAll('audio, video').forEach((el) => {
    const mediaEl = el as HTMLMediaElement
    if (!mediaEl.paused) {
      mediaEl.pause()
      mediaEl.currentTime = 0
    }
  })
}

/**
 * Resolve a stream URI for a song and start playback.
 * Shared tail of every playback command.
 */
function* startStream(songId: string): any {
  const media = yield call(getSongByIdFromLiveStore, songId)
  const fullUrl = yield call(getSongBgFromLiveStore)

  if (!media) {
    console.warn('[commands] Song not found:', songId)
    return
  }

  let streamUri = ''
  try {
    streamUri = yield getStreamUri(media, 0)
  } catch (error) {
    console.error('[commands] Error getting stream URI:', error)
  }

  if (!streamUri) {
    console.warn('[commands] No stream URI for:', songId)
    return
  }

  yield put({ type: types.SET_CURRENT_PLAYING_URL, url: streamUri })
  yield put({ type: types.SET_CURRENT_PLAYING_STREAMS, streams: media.stream })
  yield put({ type: types.SHOW_PLAYER })
  yield put({ type: types.START_PLAYING })
  yield put({ type: types.PUSH_TO_VIEW, song: songId })

  if (fullUrl) {
    yield put({ type: types.SET_BACKGROUND_IMAGE, backgroundImage: fullUrl })
  }
}

// ---------------------------------------------------------------------------
// PLAY_LIST — replace queue with a list of tracks and start from the first
// ---------------------------------------------------------------------------

export interface PlayListAction {
  type: typeof types.PLAY_LIST
  trackIds: string[]
}

/**
 * Replace the queue and play from the top.
 *
 * Dispatched by: PlayAllButton, Album.playAlbum, Playlist.handlePlayAll
 */
export function* handlePlayList(action: PlayListAction): any {
  const liveStore = getLiveStoreInstance()
  if (!liveStore) {
    console.error('[handlePlayList] LiveStore not available')
    return
  }

  if (!action.trackIds || action.trackIds.length === 0) {
    console.warn('[handlePlayList] No tracks provided')
    return
  }

  // 1. Kill audio before touching the queue — prevents reactive re-render race
  yield put({ type: types.STOP_PLAYING })
  stopAllPlayback()

  // 2. Replace queue in LiveStore (sets currentPlaying: 0)
  yield call(playAllAction, liveStore, action.trackIds)

  // 3. Resolve stream and start playback
  const firstTrackId = action.trackIds[0]
  yield call(startStream, firstTrackId)
}

// ---------------------------------------------------------------------------
// PLAY_SONG — play a specific song, populating the queue if needed
// ---------------------------------------------------------------------------

export interface PlaySongAction {
  type: typeof types.PLAY_SONG
  songId: string
  /** All visible media IDs in the current view. When the queue is empty,
   *  these populate it so next/prev navigation works. */
  contextIds?: string[]
}

/**
 * Play a single song. Queue logic:
 * - No queue + contextIds → create queue from contextIds, position to song
 * - No queue, no context → create single-song queue
 * - Queue exists, song in queue → reposition
 * - Queue exists, song not in queue → insert next and play
 *
 * Dispatched by: MusicTable row click, SongView play button, Playlist row click
 */
export function* handlePlaySong(action: PlaySongAction): any {
  const liveStore = getLiveStoreInstance()
  if (!liveStore) {
    console.error('[handlePlaySong] LiveStore not available')
    return
  }

  if (!action.songId) {
    console.warn('[handlePlaySong] No songId provided')
    return
  }

  // 1. Kill audio before touching the queue
  yield put({ type: types.STOP_PLAYING })
  stopAllPlayback()

  // 2. Ensure song is in queue and positioned correctly
  yield call(ensureInQueue, liveStore, action.songId, action.contextIds)

  // 3. Resolve stream and start playback
  yield call(startStream, action.songId)
}

// ---------------------------------------------------------------------------
// Queue population helper (moved from queueHelpers.ts)
// ---------------------------------------------------------------------------

/**
 * Ensure a song is in the queue and set it as the current position.
 * This is the saga-owned version of the old ensureMediaInQueueAndPlay.
 */
function* ensureInQueue(liveStore: any, mediaId: string, allMediaIds?: string[]): any {
  // Read current queue
  const { queryDb } = yield import('@livestore/livestore')
  const { tables } = yield import('../../stores/livestore/schema')

  const result = yield call(() =>
    liveStore.query(
      queryDb(tables.queue.select().where('id', '=', 'default').limit(1))
    )
  )

  const row = Array.isArray(result) ? result[0] : null

  const parseJson = (val: any): string[] => {
    if (!val) return []
    if (Array.isArray(val)) return val as string[]
    try { return JSON.parse(val) as string[] } catch { return [] }
  }

  const queue = row
    ? {
        trackIds: parseJson(row.trackIds),
        currentPlaying: row.currentPlaying,
        shuffle: Boolean(row.shuffle),
        repeat: Boolean(row.repeat),
      }
    : null

  if (!queue || queue.trackIds.length === 0) {
    // No queue — create one
    if (allMediaIds && allMediaIds.length > 0) {
      yield call(playAllAction, liveStore, allMediaIds)

      // Position to clicked song if it's not the first
      const index = allMediaIds.indexOf(mediaId)
      if (index > 0) {
        yield call(playMediaAction, liveStore, mediaId)
      }
    } else {
      yield call(playAllAction, liveStore, [mediaId])
    }
  } else {
    // Queue exists
    const index = queue.trackIds.indexOf(mediaId)

    if (index !== -1) {
      // Song in queue — reposition
      yield call(playMediaAction, liveStore, mediaId)
    } else {
      // Song not in queue — add next, then play
      yield call(addNextAction, liveStore, [mediaId])
      yield call(playMediaAction, liveStore, mediaId)
    }
  }
}
