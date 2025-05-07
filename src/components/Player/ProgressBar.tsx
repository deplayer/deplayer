import { Dispatch } from 'redux'
import Range from 'rc-slider'
import 'rc-slider/assets/index.css'

type Props = {
  total: number, // Milliseconds
  dispatch: Dispatch,
  onChange?: (value: number | number[]) => void,
  onAfterChange?: (value: number | number[]) => void,
  current: number // Milliseconds,
  buffered: number
}

const ProgressBar = (props: Props) => {
  // Calculate step as 1ms since we're working with millisecond precision
  const step = 1;

  // Add debug logging
  console.log('ProgressBar props:', {
    totalMs: props.total,
    currentMs: props.current,
    bufferedMs: props.buffered,
    totalSec: props.total / 1000,
    currentSec: props.current / 1000,
    bufferedSec: props.buffered / 1000,
    step
  });

  if (!props.total || props.total <= 0) {
    console.warn('Invalid total duration:', props.total);
    return null;
  }

  return (
    <div className='player-progress h-8'>
      <Range
        className='buffering-bar absolute z-10'
        min={0}
        max={props.total}
        step={step}
        styles={{ 
          handle: { display: 'none' }, 
          track: { backgroundColor: 'rgb(var(--bc) / 0.2)', zIndex: 110 }, 
          rail: { backgroundColor: 'transparent' } 
        }}
        count={1}
        value={props.buffered}
      />
      <Range
        data-testid='slider'
        className='bar absolute pointer-events-auto'
        min={0}
        max={props.total}
        step={step}
        count={1}
        value={props.current}
        onChange={props.onChange}
        styles={{ 
          track: { 
            zIndex: 11, 
            backgroundColor: 'rgb(var(--p))',
            height: '4px'
          },
          rail: { 
            backgroundColor: 'rgb(var(--bc) / 0.1)',
            height: '4px'
          },
          handle: {
            zIndex: 11,
            border: '2px solid rgb(var(--p))',
            backgroundColor: '#fff',
            cursor: 'grab',
            opacity: 1,
            boxShadow: '0 0 2px rgba(0,0,0,0.2)',
            width: '16px' 
          }
        }}
        onChangeComplete={props.onAfterChange}
      />
      <style>{`
        .player-progress:hover .rc-slider-handle {
          transform: scale(1.2);
          background-color: rgb(var(--p)) !important;
        }
      `}</style>
    </div>
  )
}

export default ProgressBar
