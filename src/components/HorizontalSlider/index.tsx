import React from 'react'
import ScrollMenu from 'react-horizontal-scrolling-menu'

import Button from '../common/Button'
import Icon from '../common/Icon'

const ArrowLeft = (
  <div
    className='text-4xl h-full z-10 absolute inset-y-0 flex left-0'
    style={{ backgroundImage: 'linear-gradient(to left, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5))' }}
  >
    <Button transparent>
      <Icon icon='faArrowCircleLeft' className='arrow-prev text-blue-200' />
    </Button>
  </div>
)

const ArrowRight = (
  <div
    className='text-4xl h-full z-10 absolute inset-y-0 flex right-0'
    style={{ backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5))' }}
  >
    <Button transparent>
      <Icon icon='faArrowCircleRight' className='arrow-prev text-blue-200' />
    </Button>
  </div>
)

type Props = {
  items: Array<any>,
  title: React.ReactNode
}

const HorizontalSlider = (props: Props) => {
  return (
    <div className='w-full mt-8 overflow-hidden'>
      <h2 className='my-4 text-xl'>{ props.title }</h2>
      <ScrollMenu
        menuClass='relative'
        wrapperStyle={{overflow: 'hidden'}}
        hideArrows
        hideSingleArrow
        alignCenter={false}
        data={props.items}
        arrowLeft={ArrowLeft}
        arrowRight={ArrowRight}
      />
    </div>
  )
}

export default HorizontalSlider