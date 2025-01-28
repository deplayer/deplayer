import { useState } from 'react'
import Button from '../common/Button'
import Icon from '../common/Icon'
import * as types from '../../constants/ActionTypes'
import { Dispatch } from 'redux'
type FullscreenButtonProps = {
  onClick: () => void,
  dispatch: Dispatch
}

const FullscreenButton = ({ onClick, dispatch }: FullscreenButtonProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleClick = () => {
    setIsFullscreen(!isFullscreen)
    dispatch({ type: types.TOGGLE_FULL_SCREEN, payload: !isFullscreen })
    onClick()
  }

  return (
    <Button
      inverted
      transparent
      size='2xl'
      onClick={handleClick}
    >
      {isFullscreen ? <Icon icon='faCompress' /> : <Icon icon='faExpand' />}
    </Button>
  )
}

export default FullscreenButton 