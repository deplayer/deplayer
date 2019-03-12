import * as React from 'react'
import { Dispatch } from 'redux'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css';

import * as types from '../../constants/ActionTypes'
import { getDurationStr } from '../../utils/timeFormatter'

type Props = {
  total: number,
  dispatch: Dispatch,
  onChange: (value: string) => any,
  current: number
}

const ProgressBar = (props: Props) => {
  return (
    <div
      className='progress'
    >
      <Slider
        className='bar'
        min={0}
        max={props.total}
        step={ 100 / props.total }
        type='range'
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
