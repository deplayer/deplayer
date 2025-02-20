import React from 'react'
import Button from '../common/Button'
import Icon from '../common/Icon'

type Props = {
  items: React.ReactNode[],
  title: React.ReactNode
}

const HorizontalSlider = (props: Props) => {
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(true);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const startTimeRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);
  const dragDistanceRef = React.useRef(0);

  const checkArrows = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(Math.ceil(scrollLeft) < scrollWidth - clientWidth);
  }, []);

  React.useEffect(() => {
    checkArrows();
    window.addEventListener('resize', checkArrows);
    return () => window.removeEventListener('resize', checkArrows);
  }, [checkArrows]);

  const handleDragStart = React.useCallback((e: React.PointerEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    startXRef.current = e.clientX;
    startTimeRef.current = Date.now();
    scrollLeftRef.current = container.scrollLeft;
    container.style.cursor = 'grabbing';
    container.setPointerCapture(e.pointerId);
  }, []);

  const handleDragMove = React.useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;

    const dx = e.clientX - startXRef.current;
    dragDistanceRef.current = Math.abs(dx);
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - dx;
  }, []);

  const handleDragEnd = React.useCallback((e: React.PointerEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Only prevent click if:
    // 1. We dragged more than 5px
    // 2. The drag lasted more than 200ms
    const dragDuration = Date.now() - startTimeRef.current;
    if (dragDistanceRef.current > 5 && dragDuration > 200) {
      const preventClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        document.removeEventListener('click', preventClick, true);
      };
      document.addEventListener('click', preventClick, true);
    }

    isDraggingRef.current = false;
    container.style.cursor = 'grab';
    container.releasePointerCapture(e.pointerId);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className='w-full'>
      <h2 className='mb-4 px-4 text-xl text-base-content truncate'>{props.title}</h2>
      <div className='relative group h-52'>
        {showLeftArrow && (
          <div className='absolute left-0 top-0 bottom-0 flex items-center bg-gradient-to-r from-base-200/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity'>
            <Button onClick={() => scroll('left')} transparent className='ml-2'>
              <Icon icon='faArrowCircleLeft' className='text-primary hover:text-primary-focus w-8 h-8' />
            </Button>
          </div>
        )}
        
        <div
          ref={scrollContainerRef}
          className='overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth h-full'
          onScroll={checkArrows}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerLeave={handleDragEnd}
          style={{ cursor: 'grab', touchAction: 'pan-x' }}
        >
          <div className='flex gap-6 px-4 select-none h-full'>
            {props.items.map((item, index) => (
              <div 
                key={index}
                className='flex-none h-full'
                draggable={false}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {showRightArrow && (
          <div className='absolute right-0 top-0 bottom-0 flex items-center bg-gradient-to-l from-base-200/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity'>
            <Button onClick={() => scroll('right')} transparent className='mr-2'>
              <Icon icon='faArrowCircleRight' className='text-primary hover:text-primary-focus w-8 h-8' />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HorizontalSlider

// Add this to your global styles
const styles = `
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scroll-smooth {
  scroll-behavior: smooth;
}
` as any;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
