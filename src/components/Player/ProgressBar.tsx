import * as React from 'react'

import { getDurationStr } from '../../utils/timeFormatter'

type Props = {
  total: number,
  current: number
}

const ProgressBar = (props: Props) => {
  const proportionalCurrent = (props.current * 100) / props.total
  return (
    <div
      className='progress-bar'
    >
      <input
        className='bar'
        min={0}
        max={100}
        step={ 100 / props.total }
        type='range'
        value={ proportionalCurrent }
      />
      <span className='total-time'>
        -{ getDurationStr(props.total * 1000 - props.current * 1000) }
      </span>
    </div>
  )
}

export default ProgressBar
