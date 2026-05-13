import React from 'react'
import Slider from 'react-slick'
import Button from '../common/Button'
import Icon from '../common/Icon'
import 'slick-carousel/slick/slick.css'

type Props = {
  items: React.ReactNode[],
  title: React.ReactNode
}

const NextArrow = (props: { onClick?: () => void }) => {
  const { onClick } = props
  return (
    <div className='absolute right-0 top-0 bottom-0 flex items-center bg-gradient-to-l from-base-200/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity'>
      <Button onClick={onClick} transparent className='mr-2' aria-label="Scroll right">
        <Icon icon='faArrowCircleRight' className='text-primary hover:text-primary-focus w-8 h-8' />
      </Button>
    </div>
  )
}

const PrevArrow = (props: { onClick?: () => void }) => {
  const { onClick } = props
  return (
    <div className='absolute left-0 top-0 bottom-0 flex items-center bg-gradient-to-r from-base-200/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity'>
      <Button onClick={onClick} transparent className='ml-2' aria-label="Scroll left">
        <Icon icon='faArrowCircleLeft' className='text-primary hover:text-primary-focus w-8 h-8' />
      </Button>
    </div>
  )
}

const HorizontalSlider = (props: Props) => {
  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    variableWidth: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    swipeToSlide: true,
  }

  return (
    <div className='w-full'>
      <h2 className='mb-4 px-4 text-xl text-base-content truncate'>{props.title}</h2>
      <div className='relative group h-52'>
        <Slider {...settings}>
          {props.items.map((item, index) => (
            <div key={`slider-item-${index}`} className='h-full' style={{ width: '170px', padding: '0' }}>
              {item}
            </div>
          ))}
        </Slider>
      </div>
    </div>
  )
}

export default HorizontalSlider