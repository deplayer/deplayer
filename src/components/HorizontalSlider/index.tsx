import React from 'react'
import ScrollMenu from 'react-horizontal-scrolling-menu'

import Button from '../common/Button'
import Icon from '../common/Icon'

const bodyBg = 'rgba(16, 27, 38, 0)'
const bodyBgAfter = 'rgba(16, 27, 38, 0.8)'

const ArrowLeft = (
  <div
    className='text-4xl z-10 absolute inset-y-0 flex left-0'
    style={{ backgroundImage: `linear-gradient(to left, ${ bodyBg }, ${ bodyBgAfter }` }}
  >
    <Button transparent>
      <Icon icon='faArrowCircleLeft' className='arrow-prev text-blue-200 hover:text-blue-800' />
    </Button>
  </div>
)

const ArrowRight = (
  <div
    className='text-4xl z-10 absolute inset-y-0 flex right-0'
    style={{ backgroundImage: `linear-gradient(to right, ${ bodyBg }, ${ bodyBgAfter }` }}
  >
    <Button transparent>
      <Icon icon='faArrowCircleRight' className='arrow-prev text-blue-200 hover:text-blue-800' />
    </Button>
  </div>
)

type Props = {
  items: Array<any>,
  title: React.ReactNode
}

const HorizontalSlider = (props: Props) => {
  return (
    <div className='w-full overflow-hidden'>
      <h2 className='my-4 px-4 text-xl'>{ props.title }</h2>
      <ScrollMenu
        wheel={false}
        menuClass='relative'
        wrapperStyle={{overflow: 'hidden'}}
        innerWrapperStyle={{paddingLeft: '10px'}}
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
