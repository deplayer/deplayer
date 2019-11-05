import { State as PlayerState } from '../../reducers/player'
import { State as SettingsState } from '../../reducers/settings'
import { Dispatch } from 'redux'

interface Props {
  id: string,
  ref: React.Ref<any>,
  playing: boolean,
  url: string,
  volume: number,
  onPlay: () => any,
  onPause: () => any,
  onEnded: () => any,
  onError: (e: Error) => any,
  onTimeUpdate: () => any,
  onProgress: (state: any) => any,
  onDuration: (state: any) => any
}

export default Props
