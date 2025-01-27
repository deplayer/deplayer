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

      const newIds = action.songs.map((song: Media) => song.id);

      // Handle both normal and shuffle queues
      const currPosition = state.shuffle 
        ? currentRandomTrackIds.indexOf(state.currentPlaying)
        : currentTrackIds.indexOf(state.currentPlaying);

      // Insert new songs after current playing song in both queues
      const newTrackIds = [...currentTrackIds];
      const newRandomTrackIds = [...currentRandomTrackIds];

      // Always update the normal queue
      newTrackIds.splice(currPosition + 1, 0, ...newIds);
      const deduplicatedTrackIds = Array.from(new Set(newTrackIds));

      // If shuffle is enabled, also update the random queue in the same way
      if (state.shuffle) {
        newRandomTrackIds.splice(currPosition + 1, 0, ...newIds);
      }

      const deduplicatedRandomTrackIds = Array.from(new Set(newRandomTrackIds));
      const activeQueue = state.shuffle ? deduplicatedRandomTrackIds : deduplicatedTrackIds;

      return {
        ...state,
        trackIds: deduplicatedTrackIds,
        randomTrackIds: deduplicatedRandomTrackIds,
        currentPlaying: state.currentPlaying,
        prevSongId: getSiblingSong(activeQueue, state.currentPlaying),
        nextSongId: getSiblingSong(activeQueue, state.currentPlaying, true),
      };
    }

    case types.REMOVE_FROM_QUEUE: {
      const songToRemove = action.song || (Array.isArray(action.data) ? action.data[0] : action.data)
      if (!songToRemove) {
        return state
      }

      // Remove from trackIds
      const newTrackIds = state.trackIds.filter(id => id !== songToRemove.id)
      
      // Remove from randomTrackIds only if in shuffle mode
      const newRandomTrackIds = state.shuffle 
        ? state.randomTrackIds.filter(id => id !== songToRemove.id)
        : state.randomTrackIds

      // Use the active queue based on shuffle state
      const activeQueue = state.shuffle ? newRandomTrackIds : newTrackIds

      // Update next and prev song IDs based on current playing song
      const nextSongId = state.currentPlaying ? (getSiblingSong(activeQueue, state.currentPlaying, true) || null) : null
      const prevSongId = state.currentPlaying ? (getSiblingSong(activeQueue, state.currentPlaying) || null) : null

      return {
        ...state,
        trackIds: newTrackIds,
        randomTrackIds: newRandomTrackIds,
        nextSongId,
        prevSongId
      }
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
        const newTrackIds = action.songs.map((song: Media) => song.id)
        return {
          ...state,
          trackIds: newTrackIds,
          randomTrackIds: state.shuffle ? shuffleArray(newTrackIds) : [],
          currentPlaying: null,
          nextSongId: newTrackIds.length > 0 ? newTrackIds[0] : null,
          prevSongId: null
        }
      }

      const updatedTrackIds = Array.from(
        new Set([
          ...state.trackIds,
          ...action.songs.map((song: Media) => song.id),
        ])
      )

      return {
        ...state,
        trackIds: updatedTrackIds,
        randomTrackIds: state.shuffle ? shuffleArray(updatedTrackIds) : state.randomTrackIds,
        nextSongId: state.currentPlaying 
          ? getSiblingSong(updatedTrackIds, state.currentPlaying, true)
          : updatedTrackIds[0],
        prevSongId: state.currentPlaying
          ? getSiblingSong(updatedTrackIds, state.currentPlaying)
          : null
      }

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
