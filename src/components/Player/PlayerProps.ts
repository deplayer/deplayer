import { State as PlayerState } from '../../reducers/player'
import { State as SettingsState } from '../../reducers/settings'
import { Dispatch } from 'redux'

interface Props {
  queue: any,
  slim: boolean,
  player: PlayerState,
  settings: SettingsState,
  ref: React.Ref<any>,
  playing: boolean,
  url: string,
  volume: number,
  itemCount: number,
  onPlay: () => any,
  onPause: () => any,
  onEnded: () => any,
  onError: () => any,
  onTimeUpdate: () => any,
  onProgress: () => any,
  onDuration: () => any,
  collection: any,
  dispatch: Dispatch,
  match: any
}

export default Props
