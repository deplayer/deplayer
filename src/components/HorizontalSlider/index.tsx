import React from 'react'
import { ScrollMenu, VisibilityContext, type publicApiType } from 'react-horizontal-scrolling-menu'
import 'react-horizontal-scrolling-menu/dist/styles.css'
import Button from '../common/Button'
import Icon from '../common/Icon'

const bodyBg = 'rgba(16, 27, 38, 0)'
const bodyBgAfter = 'rgba(16, 27, 38, 0.8)'

const ArrowLeft = () => {
  const visibility = React.useContext<publicApiType>(VisibilityContext);
  const isFirstItemVisible = visibility.useIsVisible('first', true);

  if (isFirstItemVisible) {
    return null
  }

  return (
    <div
      className='text-4xl z-10 absolute inset-y-0 flex left-0'
      style={{ backgroundImage: `linear-gradient(to left, ${bodyBg}, ${bodyBgAfter})` }}
    >
      <Button onClick={() => visibility.scrollPrev()} transparent>
        <Icon icon='faArrowCircleLeft' className='arrow-prev text-blue-200 hover:text-blue-800' />
      </Button>
    </div>
  )
}

const ArrowRight = () => {
  const visibility = React.useContext<publicApiType>(VisibilityContext);
  const isLastItemVisible = visibility.useIsVisible('last', false);

  if (isLastItemVisible) {
    return null;
  }

  return (
    <div
      className='text-4xl z-10 absolute inset-y-0 flex right-0'
      style={{ backgroundImage: `linear-gradient(to right, ${bodyBg}, ${bodyBgAfter})` }}
    >
      <Button onClick={() => visibility.scrollNext()} transparent>
        <Icon icon='faArrowCircleRight' className='arrow-prev text-blue-200 hover:text-blue-800' />
      </Button>
    </div>
  )
}

type Props = {
  items: React.ReactNode[],
  title: React.ReactNode
}

const HorizontalSlider = (props: Props) => {
  return (
    <div className='w-full overflow-hidden'>
      <h2 className='my-4 px-4 text-xl'>{props.title}</h2>
      <ScrollMenu
        LeftArrow={ArrowLeft}
        RightArrow={ArrowRight}
        transitionBehavior="smooth"
        wrapperClassName='relative'
      >
        {props.items.map((item: React.ReactNode, index: number) => {
          return <div key={index} itemID={`${index}`}>{item}</div>
        })}
      </ScrollMenu>
    </div>
  )
}

export default HorizontalSlider
