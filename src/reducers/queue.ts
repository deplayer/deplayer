import * as types from "../constants/ActionTypes";
import { IMedia } from "../entities/Media";
import { getSiblingSong } from "./utils/queues";
import { QueueAction, State } from './queue/types';

export type { State };

export const defaultState: State = {
  trackIds: [],
  randomTrackIds: [],
  currentPlaying: null,
  repeat: false,
  shuffle: false,
  nextSongId: null,
  prevSongId: null,
};

// Helper function to clean track IDs
const cleanTrackIds = (ids: Array<any>): Array<string> => {
  if (!Array.isArray(ids)) return [];
  // Use a Set to efficiently deduplicate and filter invalid values in one pass
  const validIds = new Set(
    ids.filter((id): id is string => typeof id === 'string' && id !== null && id !== '')
  );
  return Array.from(validIds);
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

  // Ensure we're working with arrays and clean IDs
  const currentIds = cleanTrackIds(sourceIds);

  // Create new trackIds array, ensuring no duplicates and no nulls
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
            ? cleanTrackIds(state.randomTrackIds)
            : [...cleanTrackIds(state.randomTrackIds), action.songId]
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
    return cleanTrackIds(state.randomTrackIds);
  }
  return cleanTrackIds(state.trackIds);
};

export default (state: State = defaultState, action: QueueAction = { type: types.CLEAR_QUEUE }): State => {
  switch (action.type) {
    case types.RECEIVE_QUEUE: {
      const queue = action.queue;

      // Clean and validate trackIds and randomTrackIds using Sets
      const trackIds = new Set<string>(cleanTrackIds(queue.trackIds || []));
      const randomTrackIds = new Set<string>(cleanTrackIds(queue.randomTrackIds || []));

      return {
        ...state,
        ...queue,
        trackIds: Array.from(trackIds),
        randomTrackIds: Array.from(randomTrackIds),
      };
    }

    case types.ADD_TO_QUEUE: {
      // Get new valid track IDs using Set for efficiency
      const newIds = new Set<string>(
        cleanTrackIds(action.songs
          .filter((song: IMedia) => song && song.id)
          .map((song: IMedia) => song.id)
        )
      );

      // Merge with existing cleaned IDs using Set operations
      const mergedIds = new Set<string>([
        ...cleanTrackIds(state.trackIds),
        ...newIds
      ]);

      // If shuffle is enabled, update random queue
      const mergedRandomIds = state.shuffle
        ? new Set<string>([...cleanTrackIds(state.randomTrackIds), ...newIds])
        : new Set<string>(state.randomTrackIds);

      return {
        ...state,
        trackIds: Array.from(mergedIds),
        randomTrackIds: Array.from(mergedRandomIds)
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

      const newIds = action.songs.map((song: IMedia) => song.id);

      // Handle both normal and shuffle queues
      const currPosition = currentTrackIds.indexOf(state.currentPlaying);
      const currRandomPosition = state.shuffle 
        ? currentRandomTrackIds.indexOf(state.currentPlaying)
        : -1;

      // Insert new songs after current playing song in both queues
      const newTrackIds = [...currentTrackIds];
      newTrackIds.splice(currPosition + 1, 0, ...cleanTrackIds(newIds));
      const deduplicatedTrackIds = Array.from(new Set(newTrackIds));

      // If shuffle is enabled, also update the random queue in the same way
      let deduplicatedRandomTrackIds = currentRandomTrackIds;
      if (state.shuffle) {
        const newRandomTrackIds = [...currentRandomTrackIds];
        newRandomTrackIds.splice(currRandomPosition + 1, 0, ...cleanTrackIds(newIds));
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
      const songToRemove = action.song || action.data;
      if (!songToRemove) {
        return state;
      }

      // Handle array of songs to remove
      if (Array.isArray(songToRemove)) {
        const songIdsToRemove = new Set(songToRemove.map(song => song.id));
        const newTrackIds = state.trackIds.filter(id => !songIdsToRemove.has(id));
        const newRandomTrackIds = state.shuffle 
          ? state.randomTrackIds.filter(id => !songIdsToRemove.has(id))
          : state.randomTrackIds;

        // Update current playing if it's one of the removed songs
        const newCurrentPlaying = state.currentPlaying && songIdsToRemove.has(state.currentPlaying) ? null : state.currentPlaying;
        const newNextSongId = state.nextSongId && songIdsToRemove.has(state.nextSongId) ? null : state.nextSongId;
        const newPrevSongId = state.prevSongId && songIdsToRemove.has(state.prevSongId) ? null : state.prevSongId;

        return {
          ...state,
          trackIds: newTrackIds,
          randomTrackIds: newRandomTrackIds,
          currentPlaying: newCurrentPlaying,
          nextSongId: newNextSongId,
          prevSongId: newPrevSongId
        };
      }

      // Handle single song removal
      const songId = songToRemove.id;
      if (!songId || !state.trackIds.includes(songId)) {
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
      const newTrackIdsById = action.replace
        ? [...action.trackIds]
        : Array.from(new Set([...state.trackIds, ...action.trackIds]));

      // When replacing, reset state except shuffle
      if (action.replace) {
        return {
          ...defaultState,
          shuffle: state.shuffle,
          trackIds: newTrackIdsById,
          randomTrackIds: state.shuffle ? shuffleArray(newTrackIdsById) : [],
          nextSongId: newTrackIdsById[0] || null,
          prevSongId: null
        }
      }

      // When appending, maintain current state
      return {
        ...state,
        trackIds: newTrackIdsById,
        randomTrackIds: state.shuffle ? shuffleArray(newTrackIdsById) : state.randomTrackIds,
        nextSongId: state.currentPlaying ? state.nextSongId : newTrackIdsById[0] || null,
        prevSongId: state.currentPlaying ? state.prevSongId : null
      };

    case types.ADD_SONGS_TO_QUEUE: {
      const newTrackIds = action.replace
        ? action.songs.map((song: IMedia) => song.id)
        : Array.from(new Set([...state.trackIds, ...action.songs.map((song: IMedia) => song.id)]))

      // When replacing, reset state except shuffle
      if (action.replace) {
        return {
          ...defaultState,
          shuffle: state.shuffle,
          trackIds: cleanTrackIds(newTrackIds),
          randomTrackIds: state.shuffle ? shuffleArray(newTrackIds) : [],
          nextSongId: newTrackIds[0] || null,
          prevSongId: null
        }
      }

      // When appending, maintain current state
      return {
        ...state,
        trackIds: cleanTrackIds(newTrackIds),
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
      // Clean up any existing null values in the state
      return {
        ...state,
        trackIds: cleanTrackIds(state.trackIds),
        randomTrackIds: cleanTrackIds(state.randomTrackIds)
      };
  }
};
