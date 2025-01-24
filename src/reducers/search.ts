import * as types from "../constants/ActionTypes";
import { StartSearchAction } from "../types/search";

export type State = {
  error: string;
  searchTerm: string;
  loading: boolean;
  searchToggled: boolean;
  searchResults: string[];
};

export const defaultState = {
  error: "",
  searchTerm: "",
  loading: false,
  searchToggled: false,
  searchResults: [],
};

type SearchAction = StartSearchAction | { type: string; [key: string]: any };

export default (state: State = defaultState, action: SearchAction = { type: '' }) => {
  switch (action.type) {
    case types.SET_SEARCH_TERM: {
      return {
        ...state,
        searchTerm: action.searchTerm,
      };
    }

    case types.SET_SEARCH_RESULTS: {
      return {
        ...state,
        searchResults: action.searchResults,
      };
    }

    case types.TOGGLE_SEARCH_OFF: {
      return {
        ...state,
        searchToggled: false,
      };
    }

    case types.TOGGLE_SEARCH: {
      return {
        ...state,
        searchToggled: !state.searchToggled,
      };
    }

    case types.START_SEARCH: {
      return {
        ...state,
        searchTerm: action.searchTerm,
        loading: true,
      };
    }

    case types.SEARCH_REJECTED: {
      return {
        ...state,
        error: action.message,
        loading: false,
      };
    }

    case types.SEARCH_FINISHED: {
      return {
        ...state,
        loading: false,
        error: '',
        searchResults: action.data ? action.data.map((item: any) => item.id) : []
      };
    }

    default:
      return state;
  }
};
