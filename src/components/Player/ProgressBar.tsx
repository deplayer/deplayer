import { Dispatch } from 'redux'
import Range from 'rc-slider'
import 'rc-slider/assets/index.css'

import { getDurationStr } from '../../utils/timeFormatter'

type Props = {
  total: number, // Milliseconds
  dispatch: Dispatch,
  onChange?: (value: number | number[]) => void,
  onAfterChange?: (value: number | number[]) => void,
  current: number // Milliseconds,
  buffered: number
}

const ProgressBar = (props: Props) => {
  const step = 100 / props.total

  return (
    <div className='player-progress relative h-8 group'>
      <Range
        className='buffering-bar absolute z-10 pointer-events-none'
        min={0}
        max={props.total}
        step={step}
        handleStyle={{ display: 'none' }}
        trackStyle={{ backgroundColor: 'rgb(var(--bc) / 0.2)' }}
        railStyle={{ backgroundColor: 'transparent' }}
        count={1}
        value={props.buffered}
      />
      <Range
        data-testid='slider'
        className='bar absolute'
        min={0}
        max={props.total}
        step={step}
        count={1}
        value={props.current}
        onChange={props.onChange}
        trackStyle={{ 
          zIndex: 11, 
          backgroundColor: 'rgb(var(--p))',
          height: '4px'
        }}
        railStyle={{ 
          backgroundColor: 'rgb(var(--bc) / 0.1)',
          height: '4px'
        }}
        handleStyle={{ 
          zIndex: 11,
          border: '2px solid rgb(var(--p))',
          backgroundColor: '#fff',
          cursor: 'pointer',
          opacity: 1,
          boxShadow: '0 0 2px rgba(0,0,0,0.2)',
          width: '16px',
          height: '16px',
          marginTop: '-6px',
          transition: 'all 0.2s ease'
        }}
        onAfterChange={props.onAfterChange}
      />
      <style>{`
        .player-progress:hover .rc-slider-handle {
          transform: scale(1.2);
          background-color: rgb(var(--p)) !important;
        }
      `}</style>
      <span className='absolute px-2 right-0 mr-0 -mt-4 text-xs text-base-content/70'>
        {getDurationStr(props.current)} - {getDurationStr(props.total)}
      </span>
    </div>
  )
}

export default ProgressBar
