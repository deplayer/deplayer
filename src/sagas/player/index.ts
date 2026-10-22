import { type Effect, call, takeLatest, takeEvery, put, select } from 'redux-saga/effects'
import screenfull from 'screenfull'
import { push } from "redux-first-history"
import type { Dispatch } from 'redux'
import type { State } from '../../reducers'
import type { MediaRow } from '../../types/media'
import type { Store } from 'redux'
import type { SagaIterator } from 'redux-saga'

import {
  getPlayer,
  getCurrentSongFromLiveStore,
} from '../selectors'
import { getStreamUri } from '../../services/Song/StreamUriService'
import * as routes from '../../routes'
import * as types from '../../constants/ActionTypes'
import { getLiveStoreInstance } from '../../stores/livestore/accessor'
import { useUIStore } from '../../stores/uiStore'
import {
  PlaybackController,
  createLiveStorePlaybackDataPort,
  type PlaybackResult,
} from '../../services/PlaybackController'
import PlayerRefService from '../../services/PlayerRefService'

// ---------------------------------------------------------------------------
// Controller instance — created once during saga startup
// ---------------------------------------------------------------------------

let controller: PlaybackController | null = null

/** @internal — exported for test setup only */
export function _setControllerForTest(ctrl: PlaybackController): void {
  controller = ctrl
}

function getController(): PlaybackController {
  if (!controller) {
    throw new Error('[Player Saga] PlaybackController not initialized')
  }
  return controller
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export interface SetCurrentPlayingAction {
  type: typeof types.SET_CURRENT_PLAYING
  songId: string
  url?: string
  media?: MediaRow
}

export interface PlayListAction {
  type: typeof types.PLAY_LIST
  trackIds: string[]
  startFromId?: string
  shuffle?: boolean
}

export interface PlaySongAction {
  type: typeof types.PLAY_SONG
  songId: string
  contextIds?: string[]
}

export interface PlaySongFromAction {
  type: typeof types.PLAY_SONG_FROM
  songId: string
  providerIndex: number
}

// ---------------------------------------------------------------------------
// Saga handlers — thin adapters around PlaybackController
// ---------------------------------------------------------------------------

export function* setCurrentPlaying(action: SetCurrentPlayingAction): Generator<Effect, void, unknown> {
  const result = yield* callController(() =>
    getController().playCurrent(action.songId, {
      media: action.media,
      streamUri: action.url,
    })
  )
  logResult(result, 'setCurrentPlaying')
}

export function* handlePlayList(action: PlayListAction): Generator<Effect, void, unknown> {
  const result = yield* callController(() =>
    getController().playList(
      action.trackIds,
      action.startFromId,
      action.shuffle ? { shuffle: true } : undefined
    )
  )
  logResult(result, 'playList')
}

function* handlePlaySong(action: PlaySongAction): Generator<Effect, void, unknown> {
  const result = yield* callController(() =>
    getController().playSong(action.songId, action.contextIds)
  )
  logResult(result, 'playSong')
}

export function* handlePlaySongFrom(action: PlaySongFromAction): SagaIterator {
  const result = yield* callController(() =>
    getController().playSong(action.songId, undefined, { providerIndex: action.providerIndex })
  )
  logResult(result, 'playSongFrom')
}

function* handlePlayNext(): Generator<Effect, void, unknown> {
  const result = yield* callController(() => getController().next())
  logResult(result, 'playNext')
}

function* handlePlayPrev(): Generator<Effect, void, unknown> {
  const result = yield* callController(() => getController().previous())
  logResult(result, 'playPrev')
}

function* handleError(): Generator<Effect, void, unknown> {
  yield put({ type: types.REGISTER_PLAYER_ERROR })

  const player = (yield select(getPlayer)) as State['player']
  const result = yield* callController(() => getController().retry(player.errorCount))
  logResult(result, 'playError')
}

function* goToViewPage(action: { type: string; song?: string }): Generator<Effect, void, unknown> {
  const state = (yield select()) as { router: { location: { pathname: string } } }

  if (!state.router.location.pathname.match(/^\/song.*?$/)) {
    return
  }

  // Use the action's song ID when present; fall back to LiveStore lookup
  const songId = action.song || ((yield call(getCurrentSongFromLiveStore)) as MediaRow | null)

  if (songId) {
    yield put(push(routes.songView(songId as string)))
  }
}

function* handleFullscreen(): Generator<Effect, void, unknown> {
  const player = (yield select(getPlayer)) as State['player']

  if (!screenfull.isEnabled) {
    return
  }

  if (player.fullscreen) {
    yield call(() => useUIStore.getState().toggleSidebar(false))
    yield call(() => screenfull.request())
  } else {
    yield call(() => screenfull.exit())
  }
}

function* handlePlayRequest(): Generator<Effect, void, unknown> {
  try {
    yield call(() => getController().play())
  } catch (error) {
    console.error('[Player Saga] play() failed:', error)
  }
}

function* handlePauseRequest(): Generator<Effect, void, unknown> {
  yield call(() => getController().pause())
}

function* handleToggleRequest(): Generator<Effect, void, unknown> {
  yield call(() => getController().toggle())
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Typed wrapper around yield call() for PlaybackController methods. */
function* callController<T>(fn: () => Promise<T>): Generator<Effect, T, unknown> {
  return (yield call(fn)) as T
}

function logResult(result: PlaybackResult, caller: string): void {
  if (result.status === 'idle') {
    console.log(`[Player Saga] ${caller}: idle \u2014 ${result.reason}`)
  }
}

// ---------------------------------------------------------------------------
// Saga entry point
// ---------------------------------------------------------------------------

function* playerSaga(store: Store): Generator<Effect, void, unknown> {
  // Construct the controller with production dependencies
  controller = new PlaybackController({
    data: createLiveStorePlaybackDataPort(getLiveStoreInstance),
    transport: PlayerRefService.getInstance(),
    dispatch: store.dispatch as Dispatch,
    setBackgroundImage: (url: string) => useUIStore.getState().setBackgroundImage(url),
    resolveStream: getStreamUri,
  })

  // Bind action handlers
  yield takeLatest(types.SET_CURRENT_PLAYING, setCurrentPlaying)
  yield takeEvery(types.PLAY_ERROR, handleError)
  yield takeLatest(types.PLAY_NEXT, handlePlayNext)
  yield takeLatest(types.PLAY_PREV, handlePlayPrev)
  yield takeLatest(types.TOGGLE_FULL_SCREEN, handleFullscreen)
  yield takeLatest(types.PUSH_TO_VIEW, goToViewPage)
  yield takeLatest(types.PLAY_LIST, handlePlayList)
  yield takeLatest(types.PLAY_SONG, handlePlaySong)
  yield takeLatest(types.PLAY_SONG_FROM, handlePlaySongFrom)
  yield takeLatest(types.PLAYBACK_PLAY_REQUESTED, handlePlayRequest)
  yield takeLatest(types.PLAYBACK_PAUSE_REQUESTED, handlePauseRequest)
  yield takeLatest(types.PLAYBACK_TOGGLE_REQUESTED, handleToggleRequest)
}

export default playerSaga
