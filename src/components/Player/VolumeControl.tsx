import * as React from 'react'
import Slider from 'rc-slider'

type Props = {
  volume: number,
  onChange: () => void
}

const VolumeControl = (props: Props) => {
  return (
    <div className='volume-control'>
      <Slider
        className='bar'
        min={0}
        max={100}
        step={ 1 }
        type='range'
        value={ props.volume }
        onChange={ props.onChange }
      />
    </div>
  )
}

export default VolumeControl
