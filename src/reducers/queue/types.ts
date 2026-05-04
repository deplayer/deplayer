import * as types from '../../constants/ActionTypes'
import type { MediaRow } from '../../types/media'

export type QueueAction =
  | { type: typeof types.ADD_SONGS_TO_QUEUE_BY_ID; trackIds: string[]; replace?: boolean }
  | { type: typeof types.ADD_SONGS_TO_QUEUE; songs: MediaRow[]; replace?: boolean }
  | { type: typeof types.SET_CURRENT_PLAYING; songId: string }
  | { type: typeof types.REMOVE_FROM_QUEUE; song?: MediaRow; data?: MediaRow | MediaRow[] }
  | { type: typeof types.RECEIVE_QUEUE; queue: Partial<State> }
  | { type: typeof types.ADD_TO_QUEUE; songs: MediaRow[] }
  | { type: typeof types.ADD_TO_QUEUE_NEXT; songs: MediaRow[] }
  | { type: typeof types.CLEAR_QUEUE }
  | { type: typeof types.SHUFFLE }
  | { type: typeof types.REPEAT };

export type State = {
  trackIds: Array<string>;
  randomTrackIds: Array<string>;
  currentPlaying: string | null;
  repeat: boolean;
  shuffle: boolean;
  nextSongId: string | null;
  prevSongId: string | null;
}; 