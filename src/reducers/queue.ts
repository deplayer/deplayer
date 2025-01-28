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

  const activeQueue = state.shuffle ? newRandomTrackIds : newTrackIds;

  return {
    ...state,
    trackIds: newTrackIds,
    randomTrackIds: newRandomTrackIds,
    currentPlaying: action.songId,
    prevSongId: getSiblingSong(activeQueue, action.songId),
    nextSongId: getSiblingSong(activeQueue, action.songId, true) || null,
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
      const currPosition = currentTrackIds.indexOf(state.currentPlaying);
      const currRandomPosition = state.shuffle 
        ? currentRandomTrackIds.indexOf(state.currentPlaying)
        : -1;

      // Insert new songs after current playing song in both queues
      const newTrackIds = [...currentTrackIds];
      newTrackIds.splice(currPosition + 1, 0, ...newIds);
      const deduplicatedTrackIds = Array.from(new Set(newTrackIds));

      // If shuffle is enabled, also update the random queue in the same way
      let deduplicatedRandomTrackIds = currentRandomTrackIds;
      if (state.shuffle) {
        const newRandomTrackIds = [...currentRandomTrackIds];
        newRandomTrackIds.splice(currRandomPosition + 1, 0, ...newIds);
        deduplicatedRandomTrackIds = Array.from(new Set(newRandomTrackIds));
      }

      const activeQueue = state.shuffle ? deduplicatedRandomTrackIds : deduplicatedTrackIds;

      return {
        ...state,
        trackIds: deduplicatedTrackIds,
        randomTrackIds: deduplicatedRandomTrackIds,
        nextSongId: getSiblingSong(activeQueue, state.currentPlaying, true) || null,
        prevSongId: state.shuffle ? null : getSiblingSong(activeQueue, state.currentPlaying) || null,
      };
    }

    case types.REMOVE_FROM_QUEUE: {
      const songToRemove = action.song || (Array.isArray(action.data) ? action.data[0] : action.data);
      if (!songToRemove || (Array.isArray(songToRemove) && songToRemove.length === 0)) {
        return state;
      }

      const songId = Array.isArray(songToRemove) ? songToRemove[0].id : songToRemove.id;
      if (!songId) {
        return state;
      }

      // If the song doesn't exist in the queue, return current state
      if (!state.trackIds.includes(songId)) {
        return state;
      }

      const newTrackIds = state.trackIds.filter(id => id !== songId);
      const newRandomTrackIds = state.shuffle 
        ? state.randomTrackIds.filter(id => id !== songId)
        : state.randomTrackIds;
      
      // Only update current playing if we're removing the current song
      const isCurrentSong = state.currentPlaying === songId;
      const newCurrentPlaying = isCurrentSong ? null : state.currentPlaying;
      
      // Keep next and prev song IDs if they're not the removed song
      const nextSongId = state.nextSongId === songId ? null : state.nextSongId;
      const prevSongId = state.prevSongId === songId ? null : state.prevSongId;
      
      return {
        ...state,
        trackIds: newTrackIds,
        randomTrackIds: newRandomTrackIds,
        currentPlaying: newCurrentPlaying,
        nextSongId,
        prevSongId
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

    case types.ADD_SONGS_TO_QUEUE: {
      const newTrackIds = action.replace
        ? action.songs.map((song: Media) => song.id)
        : Array.from(new Set([...state.trackIds, ...action.songs.map((song: Media) => song.id)]))

      // When replacing, reset state except shuffle
      if (action.replace) {
        return {
          ...defaultState,
          shuffle: state.shuffle,
          trackIds: newTrackIds,
          randomTrackIds: state.shuffle ? shuffleArray(newTrackIds) : [],
          nextSongId: newTrackIds[0] || null,
          prevSongId: null
        }
      }

      // When appending, maintain current state
      return {
        ...state,
        trackIds: newTrackIds,
        randomTrackIds: state.shuffle ? shuffleArray(newTrackIds) : state.randomTrackIds,
        nextSongId: state.currentPlaying ? state.nextSongId : newTrackIds[0] || null,
        prevSongId: state.currentPlaying ? state.prevSongId : null
      }
    }

    case types.SET_CURRENT_PLAYING:
      return setCurrentPlaying(state, action);

    case types.CLEAR_QUEUE:
      return defaultState;

    case types.SHUFFLE:
      return {
        ...state,
        shuffle: !state.shuffle,
        randomTrackIds: !state.shuffle ? shuffleArray(state.trackIds) : [],
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
