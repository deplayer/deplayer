import * as types from "../constants/ActionTypes";
import { StartSearchAction } from "../types/search";

export type State = {
  error: string;
  loading: boolean;
  searchResults: string[];
};

export const defaultState: State = {
  error: "",
  loading: false,
  searchResults: [],
};

interface SearchActionFields {
  type: string;
  searchType?: string;
  noRedirect?: boolean;
  searchResults?: string[];
  message?: string;
  data?: Array<{ id: string }>;
}

type SearchAction = StartSearchAction | SearchActionFields;

export default (state: State = defaultState, action: SearchAction = { type: '' }) => {
  switch (action.type) {
    case types.SET_SEARCH_RESULTS: {
      return {
        ...state,
        searchResults: action.searchResults,
      };
    }

    case types.START_SEARCH: {
      return {
        ...state,
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
        searchResults: action.data ? (action.data as Array<{ id: string }>).map((item) => item.id) : []
      };
    }

    default:
      return state;
  }
};
