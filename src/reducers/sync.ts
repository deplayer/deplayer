import * as types from "../constants/ActionTypes";

export type SyncStatus = "idle" | "syncing" | "error" | "success";

export type TableSyncState = {
  status: SyncStatus;
  error?: string;
};

export type State = {
  tables: Record<string, TableSyncState>;
};

export const defaultState: State = {
  tables: {},
};

export const setSyncStatus = (payload: {
  table: string;
  status: SyncStatus;
  error?: string;
}) => ({
  type: types.SET_SYNC_STATUS,
  payload,
});

export default (state: State = defaultState, action: any = {}) => {
  switch (action.type) {
    case types.SET_SYNC_STATUS:
      return {
        ...state,
        tables: {
          ...state.tables,
          [action.payload.table]: {
            status: action.payload.status,
            error: action.payload.error,
          },
        },
      };

    default:
      return state;
  }
};
