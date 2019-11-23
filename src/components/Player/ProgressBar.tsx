import * as React from 'react'
import { Dispatch } from 'redux'
import Range from 'rc-slider'
import 'rc-slider/assets/index.css';

import { getDurationStr } from '../../utils/timeFormatter'

type Props = {
  total: number, // Milliseconds
  dispatch: Dispatch,
  onChange?: (value: string) => any,
  onAfterChange?: (value: string) => any,
  current: number // Milliseconds
}

const ProgressBar = (props: Props) => {
  const step = 100 / props.total

  const diff = props.total - props.current

  return (
    <div
      className='progress player-progress'
    >
      <Range
        className='bar'
        min={0}
        max={props.total}
        step={step}
        count={1}
        value={ props.current }
        onChange={ props.onChange }
        onAfterChange={ props.onAfterChange }
      />
      <span className='absolute right-0 top-2 text-xs'>
        -{ getDurationStr(diff) }
      </span>
    </div>
  )
}

export default ProgressBar
