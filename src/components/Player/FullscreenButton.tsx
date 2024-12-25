import { useState } from 'react'
import Button from '../common/Button'
import Icon from '../common/Icon'

type FullscreenButtonProps = {
  onClick: () => void
}

const FullscreenButton = ({ onClick }: FullscreenButtonProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleClick = () => {
    setIsFullscreen(!isFullscreen)
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