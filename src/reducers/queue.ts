// DEPRECATED: This file is kept only for type compatibility during migration
// Queue functionality has been migrated to LiveStore
// Components should use LiveStore hooks instead: useQueue('default')

export type State = {
  trackIds: string[]
  randomTrackIds: string[]
  currentPlaying: string | null
  repeat: boolean
  shuffle: boolean
  nextSongId: string | null
  prevSongId: string | null
}

export const defaultState: State = {
  trackIds: [],
  randomTrackIds: [],
  currentPlaying: null,
  repeat: false,
  shuffle: false,
  nextSongId: null,
  prevSongId: null,
}
