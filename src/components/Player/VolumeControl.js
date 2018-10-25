// @flow

import React from 'react'

type Props = {
  volume: number
}

const VolumeControl = (props: Props) => {
  return (
    <React.Fragment>
      <input className='form-control-range' type='range' />
    </React.Fragment>
  )
}

export default VolumeControl
