import { Translate } from 'react-redux-i18n'
import Slider from 'rc-slider'

type Props = {
  volume: number,
  onChange: (volume: number | number[]) => void
}

const VolumeControl = (props: Props) => {
  return (
    <div className='volume-control w-full my-2 -my-2'>
      <p className='text-center pt-4 pb-2'>
        <Translate value='common.volume' />
      </p>
      <Slider
        className='bar'
        min={0}
        max={100}
        step={1}
        type='range'
        value={props.volume}
        onChange={props.onChange}
      />
    </div>
  )
}

export default VolumeControl
