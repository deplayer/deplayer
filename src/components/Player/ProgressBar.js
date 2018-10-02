// @flow

import React from 'react'

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
    </div>
  )
}

export default ProgressBar
