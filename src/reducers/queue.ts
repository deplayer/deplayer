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

export default (state: State = defaultState, action: any = {}): State => {
  switch (action.type) {
    case types.RECEIVE_QUEUE: {
      const queue = action.queue;

      // Clean and validate trackIds and randomTrackIds using Sets
      const trackIds = new Set<string>(cleanTrackIds(queue.trackIds));
      const randomTrackIds = new Set<string>(cleanTrackIds(queue.randomTrackIds));

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
        action.songs
          .filter((song: Media) => song && song.id)
          .map((song: Media) => song.id)
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
      console.log('Queue reducer: REMOVE_FROM_QUEUE action received:', action)
      const songToRemove = action.song || (Array.isArray(action.data) ? action.data[0] : action.data);
      console.log('Queue reducer: songToRemove:', songToRemove)
      if (!songToRemove || (Array.isArray(songToRemove) && songToRemove.length === 0)) {
        console.log('Queue reducer: No song to remove')
        return state;
      }

      const songId = Array.isArray(songToRemove) ? songToRemove[0].id : songToRemove.id;
      console.log('Queue reducer: songId to remove:', songId)
      if (!songId) {
        console.log('Queue reducer: No songId found')
        return state;
      }

      // If the song doesn't exist in the queue, return current state
      if (!state.trackIds.includes(songId)) {
        console.log('Queue reducer: Song not found in queue')
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
      
      console.log('Queue reducer: Returning new state with song removed')
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
      // Clean up any existing null values in the state
      return {
        ...state,
        trackIds: cleanTrackIds(state.trackIds),
        randomTrackIds: cleanTrackIds(state.randomTrackIds)
      };
  }
};
