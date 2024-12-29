import * as types from "../constants/ActionTypes";
import Media from "../entities/Media";
import { getSiblingSong } from "./utils/queues";

export type State = {
  trackIds: Array<string>;
  randomTrackIds: Array<string>;
  currentPlaying: string | null;
  repeat: boolean;
  shuffle: boolean;
  nextSongId: string | null;
  prevSongId: string | null;
};

export const defaultState = {
  trackIds: [],
  randomTrackIds: [],
  currentPlaying: null,
  repeat: false,
  shuffle: false,
  nextSongId: null,
  prevSongId: null,
};

const shuffleArray = (array: Array<any>) => {
  const newArray = [...array];

  for (var i = newArray.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = newArray[i];
    newArray[i] = newArray[j];
    newArray[j] = temp;
  }

  return newArray;
};

const setCurrentPlaying = (state: State, action: { songId: string }) => {
  const sourceIds = getCurrentQueue(state);

  // Ensure we're working with arrays
  const currentIds = Array.isArray(sourceIds) ? sourceIds : [];

  // Create new trackIds array, ensuring no duplicates
  const newTrackIds = Array.from(
    new Set(
      currentIds.includes(action.songId)
        ? currentIds
        : [...currentIds, action.songId]
    )
  );

  // If we're in shuffle mode, we need to update randomTrackIds as well
  const newRandomTrackIds = state.shuffle
    ? Array.from(
        new Set(
          state.randomTrackIds.includes(action.songId)
            ? state.randomTrackIds
            : [...state.randomTrackIds, action.songId]
        )
      )
    : state.randomTrackIds;

  return {
    ...state,
    trackIds: newTrackIds,
    randomTrackIds: newRandomTrackIds,
    currentPlaying: action.songId,
    prevSongId: getSiblingSong(newTrackIds, action.songId),
    nextSongId: getSiblingSong(newTrackIds, action.songId, true),
  };
};

const getCurrentQueue = (state: State): Array<string> => {
  if (state.shuffle) {
    return state.randomTrackIds;
  }

  return state.trackIds;
};

export default (state: State = defaultState, action: any = {}): State => {
  switch (action.type) {
    case types.RECEIVE_QUEUE: {
      const queue = action.queue;

      // Convert trackIds and randomTrackIds to arrays if they're objects
      const trackIds = Array.isArray(queue.trackIds) ? queue.trackIds : [];
      const randomTrackIds = Array.isArray(queue.randomTrackIds)
        ? queue.randomTrackIds
        : [];

      return {
        ...state,
        ...queue,
        trackIds,
        randomTrackIds,
      };
    }

    case types.ADD_TO_QUEUE: {
      // Ensure we're working with arrays
      const currentTrackIds = Array.isArray(state.trackIds)
        ? state.trackIds
        : [];
      const currentRandomTrackIds = Array.isArray(state.randomTrackIds)
        ? state.randomTrackIds
        : [];

      // Get new track IDs to add
      const newIds = action.songs.map((song: Media) => song.id);

      // Create new arrays with no duplicates
      const newTrackIds = Array.from(new Set([...currentTrackIds, ...newIds]));
      const newRandomTrackIds = state.shuffle
        ? Array.from(new Set([...currentRandomTrackIds, ...newIds]))
        : currentRandomTrackIds;

      return {
        ...state,
        trackIds: newTrackIds,
        randomTrackIds: newRandomTrackIds,
      };
    }

    case types.ADD_TO_QUEUE_NEXT: {
      if (!state.currentPlaying) {
        return state;
      }

      // Ensure we're working with arrays
      const currentTrackIds = Array.isArray(state.trackIds)
        ? state.trackIds
        : [];
      const currentRandomTrackIds = Array.isArray(state.randomTrackIds)
        ? state.randomTrackIds
        : [];

      const currPosition = currentTrackIds.indexOf(state.currentPlaying);
      const newIds = action.songs.map((song: Media) => song.id);

      // Insert new songs after current playing song
      const newTrackIds = [...currentTrackIds];
      newTrackIds.splice(currPosition + 1, 0, ...newIds);

      // Deduplicate the arrays
      const deduplicatedTrackIds = Array.from(new Set(newTrackIds));
      const newRandomTrackIds = state.shuffle
        ? Array.from(new Set([...currentRandomTrackIds, ...newIds]))
        : currentRandomTrackIds;

      return {
        ...state,
        trackIds: deduplicatedTrackIds,
        randomTrackIds: newRandomTrackIds,
        currentPlaying: state.currentPlaying,
        prevSongId: getSiblingSong(deduplicatedTrackIds, state.currentPlaying),
        nextSongId: getSiblingSong(
          deduplicatedTrackIds,
          state.currentPlaying,
          true
        ),
      };
    }

    case types.REMOVE_FROM_QUEUE: {
      const trackIndex = state.trackIds.indexOf(action.song.id);
      if (trackIndex === -1) return state;

      const newTrackIds = [...state.trackIds];
      newTrackIds.splice(trackIndex, 1);

      return {
        ...state,
        trackIds: newTrackIds,
      };
    }

    case types.ADD_SONGS_TO_QUEUE_BY_ID:
      if (action.replace) {
        return {
          ...state,
          trackIds: [...action.trackIds],
        };
      }

      return {
        ...state,
        trackIds: Array.from(new Set([...state.trackIds, ...action.trackIds])),
      };

    case types.ADD_SONGS_TO_QUEUE:
      if (action.replace) {
        return {
          ...state,
          trackIds: action.songs.map((song: Media) => song.id),
        };
      }

      return {
        ...state,
        trackIds: Array.from(
          new Set([
            ...state.trackIds,
            ...action.songs.map((song: Media) => song.id),
          ])
        ),
      };

    case types.SET_CURRENT_PLAYING:
      return setCurrentPlaying(state, action);

    case types.CLEAR_QUEUE:
      return defaultState;

    case types.SHUFFLE:
      return {
        ...state,
        shuffle: !state.shuffle,
        randomTrackIds: shuffleArray(state.trackIds),
      };

    case types.REPEAT:
      return {
        ...state,
        repeat: !state.repeat,
      };

    default:
      return state;
  }
};
