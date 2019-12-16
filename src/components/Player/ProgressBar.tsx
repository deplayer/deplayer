import * as React from 'react'
import { Dispatch } from 'redux'
import Range from 'rc-slider'

import { getDurationStr } from '../../utils/timeFormatter'

type Props = {
  total: number, // Milliseconds
  dispatch: Dispatch,
  onChange?: (value: string) => any,
  onAfterChange?: (value: string) => any,
  current: number // Milliseconds,
  buffered: number
}

const ProgressBar = (props: Props) => {
  const step = 100 / props.total

  return (
    <div
      className='progress player-progress'
    >
      <Range
        className='buffering-bar absolute z-10 pointer-events-none'
        min={0}
        max={props.total}
        step={step}
        handle={() => null}
        handleStyle={{ display: 'none' }}
        trackStyle={{ backgroundColor: '#2c5282' }}
        count={1}
        value={ props.buffered }
      />
      <Range
        className='bar'
        min={0}
        max={props.total}
        step={step}
        count={1}
        value={ props.current }
        onChange={ props.onChange }
        trackStyle={{ zIndex: 11, backgroundColor: '#4299e1' }}
        handleStyle={{ zIndex: 11 }}
        onAfterChange={ props.onAfterChange }
      />
      <span className='absolute bg-black px-2 right-0 mr-0 -mt-8 text-xs text-yellow-400'>
        { getDurationStr(props.current)} - { getDurationStr(props.total) }
      </span>
    </div>
  )
}

export default ProgressBar
