import * as React from 'react'
import { Dispatch } from 'redux'
import Range from 'rc-slider'
import 'rc-slider/assets/index.css';

import { getDurationStr } from '../../utils/timeFormatter'

type Props = {
  total: number,
  dispatch: Dispatch,
  onChange: (value: string) => any,
  current: number
}

const ProgressBar = (props: Props) => {
  const step =  100 / props.total

  return (
    <div
      className='progress'
    >
      <Range
        className='bar'
        min={0}
        max={props.total}
        step={step}
        count={1}
        value={ props.current }
        onChange={ props.onChange }
      />
      <span className='total-time'>
        -{ getDurationStr(props.total * 1000 - props.current * 1000) }
      </span>
    </div>
  )
}

export default ProgressBar
