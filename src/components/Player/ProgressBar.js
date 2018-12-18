// @flow

import React from 'react'
import { getDurationStr } from '../../utils/timeFormatter'

type Props = {
  total: number,
  current: number
}

const ProgressBar = (props: Props) => {
  const barWidth = (props.current * 100) / props.total
  return (
    <div
      className='progress-bar'
    >
      <div className='bar' style={{width: `${barWidth}%`}}>
        <div className='progress'></div>
      </div>

      <span className='total-time'>
        { getDurationStr(props.total * 1000) }
      </span>
    </div>
  )
}

export default ProgressBar
