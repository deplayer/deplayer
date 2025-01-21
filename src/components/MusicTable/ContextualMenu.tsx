import { Translate } from 'react-redux-i18n'
import React, { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { Dispatch } from 'redux'

import Button from '../common/Button'
import Icon from '../common/Icon'
import Media from '../../entities/Media'
import { State as QueueState } from '../../reducers/queue'
import * as types from '../../constants/ActionTypes'

// Global state for active menu
let activeMenuId: string | null = null;
let setActivePosition: ((pos: { x: number, y: number }) => void) | null = null;

type MenuProps = {
  dispatch: Dispatch,
  disableAddButton?: boolean,
  queue?: QueueState,
  onClick: () => void,
  song: Media,
}

type Position = {
  x: number
  y: number
}

const getAdjustedPosition = (triggerRect: DOMRect): Position => {
  const menuWidth = 200 // min-w-[200px] from our CSS
  const menuHeight = 250 // Approximate max height of menu
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let x = triggerRect.left
  let y = triggerRect.bottom

  // Check horizontal overflow
  if (x + menuWidth > viewportWidth) {
    x = viewportWidth - menuWidth - 10 // 10px padding from viewport edge
  }

  // Check vertical overflow
  if (y + menuHeight > viewportHeight) {
    y = triggerRect.top - menuHeight // Show above the trigger
    if (y < 0) { // If still doesn't fit, show below but adjust height
      y = triggerRect.bottom
    }
  }

  return { x, y }
}

const ContextualMenu = (props: MenuProps) => {
  const { onClick, disableAddButton, song } = props
  const [position, setPosition] = React.useState<Position>({ x: 0, y: 0 })
  const isOpen = activeMenuId === song.id

  // Store the setter in the module scope
  React.useEffect(() => {
    setActivePosition = setPosition
    return () => {
      if (activeMenuId === song.id) {
        activeMenuId = null
      }
      if (setActivePosition === setPosition) {
        setActivePosition = null
      }
    }
  }, [song.id])

  const addToQueue = () => {
    props.dispatch({ type: types.ADD_TO_QUEUE, songs: [props.song] })
    activeMenuId = null
  }

  const removeFromQueue = () => {
    props.dispatch({ type: types.REMOVE_FROM_QUEUE, data: [props.song] })
    activeMenuId = null
  }

  const removeFromDatabase = () => {
    props.dispatch({ type: types.REMOVE_FROM_COLLECTION, data: [props.song] })
    activeMenuId = null
  }

  const handlePlay = () => {
    onClick()
    activeMenuId = null
  }

  const handleAddNext = () => {
    props.dispatch({ type: types.ADD_TO_QUEUE_NEXT, songs: [props.song] })
    activeMenuId = null
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const newPosition = getAdjustedPosition(rect)
    
    // If this menu is already open, close it
    if (activeMenuId === song.id) {
      activeMenuId = null
      return
    }

    // Close any other menu and open this one
    activeMenuId = song.id
    setPosition(newPosition)
    // Update position for other instances if they're mounted
    if (setActivePosition && setActivePosition !== setPosition) {
      setActivePosition(newPosition)
    }
  }

  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('.context-menu') && !target.closest('.menu-trigger')) {
      activeMenuId = null
      // Force a re-render on all menu instances
      if (setActivePosition) {
        setActivePosition(position)
      }
    }
  }, [position])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, handleClickOutside])

  return (
    <>
      <div 
        onClick={handleClick}
        className='cursor-pointer p-2 menu-trigger'
      >
        <Icon icon='faEllipsisV' className='text-blue-400' />
      </div>
      {isOpen && createPortal(
        <div 
          className='context-menu fixed bg-base-300 rounded-lg shadow-lg py-1 min-w-[200px] z-50'
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`
          }}
        >
          <Button
            fullWidth
            transparent
            alignLeft
            onClick={handlePlay}
            className='px-4 py-2 hover:bg-base-200 w-full'
          >
            <i className='icon play mr-2'></i>
            <Translate value='buttons.play' />
          </Button>

          {!disableAddButton && (
            <Button
              fullWidth
              transparent
              alignLeft
              onClick={addToQueue}
              className='px-4 py-2 hover:bg-base-200 w-full'
            >
              <Icon
                icon='faPlusCircle'
                className='mr-2'
              />
              <Translate value='buttons.addToQueue' />
            </Button>
          )}

          {!disableAddButton && props.queue?.currentPlaying && (
            <Button
              fullWidth
              transparent
              alignLeft
              onClick={handleAddNext}
              className='px-4 py-2 hover:bg-base-200 w-full'
            >
              <Icon
                icon='faPlusCircle'
                className='mr-2'
              />
              <Translate value='buttons.addNext' />
            </Button>
          )}

          {disableAddButton && (
            <Button
              fullWidth
              transparent
              alignLeft
              onClick={removeFromQueue}
              className='px-4 py-2 hover:bg-base-200 w-full'
            >
              <i className='icon remove mr-2'></i>
              <Translate value='buttons.remove' />
            </Button>
          )}

          <Button
            fullWidth
            transparent
            alignLeft
            onClick={removeFromDatabase}
            className='px-4 py-2 hover:bg-base-200 w-full'
          >
            <i className='icon remove mr-2'></i>
            <Translate value='buttons.removeFromCollection' />
          </Button>
        </div>,
        document.body
      )}
    </>
  )
}

export default ContextualMenu
