import React from 'react'
import { ScrollMenu, VisibilityContext, type publicApiType } from 'react-horizontal-scrolling-menu'
import 'react-horizontal-scrolling-menu/dist/styles.css'
import Button from '../common/Button'
import Icon from '../common/Icon'

const bodyBg = 'rgba(16, 27, 38, 0)'
const bodyBgAfter = 'rgba(16, 27, 38, 0.8)'

const ArrowLeft = () => {
  const visibility = React.useContext<publicApiType>(VisibilityContext);

  return (
    <div
      className='text-4xl z-10 absolute inset-y-0 flex left-0'
      style={{ backgroundImage: `linear-gradient(to left, ${bodyBg}, ${bodyBgAfter})` }}
    >
      <Button onClick={visibility.scrollPrev} transparent>
        <Icon icon='faArrowCircleLeft' className='arrow-prev text-blue-200 hover:text-blue-800' />
      </Button>
    </div>
  )
}

const ArrowRight = () => {
  const visibility = React.useContext<publicApiType>(VisibilityContext);

  return (
    <div
      className='text-4xl z-10 absolute inset-y-0 flex right-0'
      style={{ backgroundImage: `linear-gradient(to right, ${bodyBg}, ${bodyBgAfter})` }}
    >
      <Button onClick={visibility.scrollNext} transparent>
        <Icon icon='faArrowCircleRight' className='arrow-prev text-blue-200 hover:text-blue-800' />
      </Button>
    </div>
  )
}

type Props = {
  items: any,
  title: React.ReactNode
}

const HorizontalSlider = (props: Props) => {
  return (
    <div className='w-full overflow-hidden relative'>
      <h2 className='my-4 px-4 text-xl'>{props.title}</h2>
      <ScrollMenu
        onWheel={() => null}
        wrapperClassName='overflow-hidden'
        LeftArrow={ArrowLeft}
        RightArrow={ArrowRight}
      >
        {props.items}
      </ScrollMenu>
    </div>
  )
}

export default HorizontalSlider
