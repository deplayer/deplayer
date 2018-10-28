// @flow

import React from 'react'

type Props = {
  volume: number,
  onChange: () => void
}

const VolumeControl = (props: Props) => {
  return (
    <div className='volume-control'>
      <input
        className='form-control-range'
        type='range'
        min='0'
        max='100'
        value={props.volume}
        onChange={props.onChange}
      />
    </div>
  )
}

export default VolumeControl
