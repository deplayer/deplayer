import * as React from 'react'
import Slider from 'rc-slider'

type Props = {
  volume: number,
  onChange: (volume: number) => void
}

const VolumeControl = (props: Props) => {
  return (
    <div className='volume-control w-full my-2 -my-2'>
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
