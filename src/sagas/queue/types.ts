import { IMedia } from '../../entities/Media'
import * as types from '../../constants/ActionTypes'

export interface QueueState {
  trackIds: string[]
  randomTrackIds: string[]
  currentPlaying: string | null
  repeat: boolean
  shuffle: boolean
  nextSongId: string | null
  prevSongId: string | null
}

export interface CollectionState {
  rows: { [key: string]: IMedia }
  songsByAlbum: { [key: string]: string[] }
  // ... other collection state properties
}

// Action Types
export interface AddAlbumToQueueAction {
  type: typeof types.ADD_ALBUM_TO_QUEUE
  albumId: string
}

export interface AddSongsToQueueAction {
  type: typeof types.ADD_SONGS_TO_QUEUE
  songs: IMedia[]
  replace: boolean
}

export interface PlayAllAction {
  type: typeof types.PLAY_ALL
  path?: string
}

export interface AddToQueueNextAction {
  type: typeof types.ADD_TO_QUEUE_NEXT
  songs?: IMedia[]
  path?: string
}

export interface SetCurrentPlayingAction {
  type: typeof types.SET_CURRENT_PLAYING
  songId: string
}

export interface StartPlayingAction {
  type: typeof types.START_PLAYING
}

// Union type for all queue-related actions
export type QueueActionTypes =
  | AddAlbumToQueueAction
  | AddSongsToQueueAction
  | PlayAllAction
  | AddToQueueNextAction
  | SetCurrentPlayingAction
  | StartPlayingAction 