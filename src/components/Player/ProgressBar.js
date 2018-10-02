// @flow

import React from 'react'

type Props = {
  total: number,
  current: number
}

const ProgressBar = (props: Props) => {
  return (
    <div
      className='progress-bar'
      data-value={ props.current }
      data-total={ props.total }
    >
      <div className='bar'>
        <div className='progress'></div>
      </div>
    </div>
  )
}

export default ProgressBar
