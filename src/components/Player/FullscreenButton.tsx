import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenState = !!document.fullscreenElement
      setIsFullscreen(fullscreenState)
      dispatch({ type: types.TOGGLE_FULL_SCREEN, payload: fullscreenState })
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [dispatch])

  const handleClick = () => {
    onClick()
  }

  return (
    <Button
      inverted
      transparent
      size='2xl'
      onClick={handleClick}
      aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
    >
      {isFullscreen ? <Icon icon='faCompress' /> : <Icon icon='faExpand' />}
    </Button>
  )
}

export default FullscreenButton 