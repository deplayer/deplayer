import React from 'react'
import { ScrollMenu, VisibilityContext, type publicApiType } from 'react-horizontal-scrolling-menu'
import 'react-horizontal-scrolling-menu/dist/styles.css'
import Button from '../common/Button'
import Icon from '../common/Icon'

function onWheel(apiObj: publicApiType, ev: React.WheelEvent): void {
  // NOTE: no good standart way to distinguish touchpad scrolling gestures
  // but can assume that gesture will affect X axis, mouse scroll only Y axis
  // of if deltaY too small probably is it touchpad
  const isThouchpad = Math.abs(ev.deltaX) !== 0 || Math.abs(ev.deltaY) < 15;

  if (isThouchpad) {
    ev.stopPropagation();
    return;
  }

  if (ev.deltaY < 0) {
    apiObj.scrollPrev();
  } else {
    apiObj.scrollNext();
  }
}

class DragDealer {
  clicked: boolean;
  dragging: boolean;
  position: number;

  constructor() {
    this.clicked = false;
    this.dragging = false;
    this.position = 0;
  }

  public dragStart = (ev: React.MouseEvent) => {
    this.position = ev.clientX;
    this.clicked = true;
  };

  public dragStop = () => {
    window.requestAnimationFrame(() => {
      this.dragging = false;
      this.clicked = false;
    });
  };

  public dragMove = (ev: React.MouseEvent, cb: (posDiff: number) => void) => {
    const newDiff = this.position - ev.clientX;

    const movedEnough = Math.abs(newDiff) > 5;

    if (this.clicked && movedEnough) {
      this.dragging = true;
    }

    if (this.dragging && movedEnough) {
      this.position = ev.clientX;
      cb(newDiff);
    }
  };
}

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
  // NOTE: for drag by mouse
  const dragState = React.useRef(new DragDealer());

  const handleDrag = ({ scrollContainer }: publicApiType) =>
    (ev: React.MouseEvent) =>
      dragState.current.dragMove(ev, (posDiff) => {
        if (scrollContainer.current) {
          scrollContainer.current.scrollLeft += posDiff;
        }
      })

  const onMouseDown = React.useCallback(
    () => dragState.current.dragStart,
    [dragState],
  )
  const onMouseUp = React.useCallback(
    () => dragState.current.dragStop,
    [dragState],
  )

  return (
    <div className='w-full overflow-hidden' onMouseLeave={dragState.current.dragStop}>
      <h2 className='my-4 px-4 text-xl'>{props.title}</h2>
      <ScrollMenu
        LeftArrow={ArrowLeft}
        RightArrow={ArrowRight}
        transitionBehavior="smooth"
        wrapperClassName='relative overflow-y-hidden'
        scrollContainerClassName='overflow-x-hidden'
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={handleDrag}
        onWheel={onWheel}
      >
        {props.items.map((item: React.ReactNode, index: number) => {
          return <div key={index} itemID={`${index}`}>{item}</div>
        })}
      </ScrollMenu>
    </div>
  )
}

export default HorizontalSlider
