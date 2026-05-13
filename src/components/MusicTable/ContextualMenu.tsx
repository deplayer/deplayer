import { Translate } from 'react-redux-i18n'
import React, { useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Dispatch } from 'redux'
import { useAppStore } from '../../stores/livestore/store'

import Button from '../common/Button'
import Icon from '../common/Icon'
import type { MediaRow } from '../../types/media'
import { State as QueueState } from '../../reducers/queue'
import * as types from '../../constants/ActionTypes'
import { addToQueueAction, addNextAction, removeFromQueueAction } from '../../stores/livestore/actions'

// Global state for active menu with better synchronization
let activeMenuId: string | null = null;
const menuInstances = new Set<() => void>();

// Function to close all menus and notify all instances
const closeAllMenus = () => {
  activeMenuId = null;
  // Notify all menu instances to update their state
  menuInstances.forEach(updateInstance => updateInstance());
};

type MenuProps = {
  dispatch: Dispatch,
  disableAddButton?: boolean,
  queue?: QueueState,
  onClick: () => void,
  song: MediaRow,
}

type Position = {
  x: number
  y: number
}

type MenuDimensions = {
  width: number
  height: number
}

// Enhanced positioning calculation with better edge case handling
const getAdjustedPosition = (
  triggerRect: DOMRect, 
  menuDimensions: MenuDimensions,
  clickPosition?: { x: number, y: number }
): Position => {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const scrollX = window.scrollX || window.pageXOffset
  const scrollY = window.scrollY || window.pageYOffset
  
  // Account for browser zoom
  const zoomLevel = window.devicePixelRatio || 1
  const adjustedMenuWidth = menuDimensions.width / zoomLevel
  const adjustedMenuHeight = menuDimensions.height / zoomLevel
  
  // Use click position if available (for right-click), otherwise use trigger element position
  let x = clickPosition ? clickPosition.x : triggerRect.left + scrollX
  let y = clickPosition ? clickPosition.y : triggerRect.bottom + scrollY
  
  // Safety padding from viewport edges
  const padding = 8
  
  // Horizontal positioning logic
  if (x + adjustedMenuWidth > viewportWidth + scrollX - padding) {
    // Try positioning to the left of the trigger
    const leftPosition = clickPosition 
      ? clickPosition.x - adjustedMenuWidth
      : triggerRect.right + scrollX - adjustedMenuWidth
    
    if (leftPosition >= scrollX + padding) {
      x = leftPosition
    } else {
      // If it doesn't fit on either side, position it at the edge with padding
      x = Math.max(scrollX + padding, viewportWidth + scrollX - adjustedMenuWidth - padding)
    }
  }
  
  // Ensure minimum distance from left edge
  x = Math.max(x, scrollX + padding)
  
  // Vertical positioning logic
  if (y + adjustedMenuHeight > viewportHeight + scrollY - padding) {
    // Try positioning above the trigger
    const topPosition = clickPosition
      ? clickPosition.y - adjustedMenuHeight
      : triggerRect.top + scrollY - adjustedMenuHeight
    
    if (topPosition >= scrollY + padding) {
      y = topPosition
    } else {
      // If it doesn't fit above or below, position it at the bottom edge
      y = Math.max(scrollY + padding, viewportHeight + scrollY - adjustedMenuHeight - padding)
    }
  }
  
  // Ensure minimum distance from top edge
  y = Math.max(y, scrollY + padding)
  
  return { x, y }
}

const ContextualMenu = (props: MenuProps) => {
  const { onClick, disableAddButton, song } = props
  const liveStore = useAppStore()
  const [position, setPosition] = React.useState<Position>({ x: 0, y: 0 })
  const [clickPosition, setClickPosition] = React.useState<{ x: number, y: number } | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = React.useState(0)

  // Register this instance for global state updates
  useEffect(() => {
    const updateInstance = () => {
      const shouldBeOpen = activeMenuId === song.id
      setIsOpen(prev => prev === shouldBeOpen ? prev : shouldBeOpen)
      if (!shouldBeOpen) {
        setClickPosition(null)
        setFocusedIndex(0)
      }
    };

    menuInstances.add(updateInstance);
    
    // Initial state sync
    updateInstance();

    return () => {
      menuInstances.delete(updateInstance);
      // If this was the active menu, close it
      if (activeMenuId === song.id) {
        activeMenuId = null;
      }
    };
  }, [song.id]);

  // Get menu items for keyboard navigation
  const getMenuItems = useCallback(() => {
    const items = []
    items.push('play')
    if (!disableAddButton) {
      items.push('addToQueue')
      if (props.queue?.currentPlaying) {
        items.push('addNext')
      }
    }
    if (props.queue && props.queue.trackIds.includes(song.id)) {
      items.push('removeFromQueue')
    }
    items.push('removeFromCollection')
    return items
  }, [disableAddButton, props.queue, song.id])

  const menuItems = getMenuItems()

  // Calculate menu position after render
  useEffect(() => {
    if (isOpen && menuRef.current && triggerRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect()
      const triggerRect = triggerRef.current.getBoundingClientRect()
      
      const menuDimensions = {
        width: menuRect.width || 200, // fallback width
        height: menuRect.height || 250 // fallback height
      }
      
      const newPosition = getAdjustedPosition(triggerRect, menuDimensions, clickPosition || undefined)
      setPosition(newPosition)
    }
  }, [isOpen, clickPosition])

  const closeMenu = useCallback(() => {
    closeAllMenus()
  }, [])

  const addToQueue = async () => {
    if (!liveStore) return
    
    try {
      await addToQueueAction(liveStore, [props.song.id])
      closeMenu()
    } catch (error) {
      console.error('Failed to add to queue:', error)
    }
  }

  const removeFromQueue = async () => {
    if (!liveStore) return
    
    try {
      await removeFromQueueAction(liveStore, props.song.id)
      closeMenu()
    } catch (error) {
      console.error('Failed to remove from queue:', error)
    }
  }

  const removeFromDatabase = () => {
    props.dispatch({ type: types.REMOVE_FROM_COLLECTION, data: [props.song] })
    closeMenu()
  }

  const handlePlay = () => {
    onClick()
    closeMenu()
  }

  const handleAddNext = async () => {
    if (!liveStore) return
    
    try {
      const firstTrackId = await addNextAction(liveStore, [props.song.id])
      closeMenu()
      
      // Dispatch if we need to trigger playback
      if (firstTrackId) {
        props.dispatch({ 
          type: types.ADD_TO_QUEUE_NEXT_COMPLETED,
          trackId: firstTrackId 
        })
      }
    } catch (error) {
      console.error('Failed to add next:', error)
    }
  }

  // Enhanced click handler with right-click support
  const handleMenuItemClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // If this menu is already open, close it
    if (activeMenuId === song.id) {
      closeMenu()
      return
    }

    // Close any other open menu first
    closeAllMenus()

    // Store click position for better positioning
    if ('clientX' in e && 'clientY' in e) {
      setClickPosition({
        x: e.clientX + (window.scrollX || window.pageXOffset),
        y: e.clientY + (window.scrollY || window.pageYOffset)
      })
    }

    // Open this menu
    activeMenuId = song.id
    setIsOpen(true)
    setFocusedIndex(0)
  }

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Close any other open menu first
    closeAllMenus()
    
    setClickPosition({
      x: e.clientX + (window.scrollX || window.pageXOffset),
      y: e.clientY + (window.scrollY || window.pageYOffset)
    })
    
    activeMenuId = song.id
    setIsOpen(true)
    setFocusedIndex(0)
  }

  // Enhanced keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleMenuItemClick(e)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        closeMenu()
        triggerRef.current?.focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => (prev + 1) % menuItems.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        executeMenuAction(menuItems[focusedIndex])
        break
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setFocusedIndex(menuItems.length - 1)
        break
    }
  }

  const executeMenuAction = (action: string) => {
    switch (action) {
      case 'play':
        handlePlay()
        break
      case 'addToQueue':
        addToQueue()
        break
      case 'addNext':
        handleAddNext()
        break
      case 'removeFromQueue':
        removeFromQueue()
        break
      case 'removeFromCollection':
        removeFromDatabase()
        break
    }
  }

  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('.context-menu') && !target.closest('.menu-trigger')) {
      closeMenu()
    }
  }, [closeMenu])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      const keydownHandler = (e: KeyboardEvent) => {
        handleKeyDown(e as unknown as React.KeyboardEvent)
      }
      document.addEventListener('keydown', keydownHandler)
      return () => {
        document.removeEventListener('click', handleClickOutside)
        document.removeEventListener('keydown', keydownHandler)
      }
    }
  }, [isOpen, handleClickOutside, handleKeyDown])

  // Focus management
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menuItems = menuRef.current.querySelectorAll('[role="menuitem"]')
      if (menuItems[focusedIndex]) {
        (menuItems[focusedIndex] as HTMLElement).focus()
      }
    }
  }, [isOpen, focusedIndex])

  const getButtonClassName = (index: number) => {
    const baseClasses = 'px-4 py-2 hover:bg-base-200 w-full text-left focus:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset'
    return focusedIndex === index ? `${baseClasses} bg-base-200` : baseClasses
  }

  return (
    <>
      <div 
        ref={triggerRef}
        onClick={handleMenuItemClick}
        onContextMenu={handleContextMenu}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleMenuItemClick(e)
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Open context menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className='cursor-pointer p-2 menu-trigger focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded'
      >
        <Icon icon='faEllipsisV' className='text-blue-400' />
      </div>
      {isOpen && createPortal(
        <div 
          ref={menuRef}
          role="menu"
          aria-label="Song actions menu"
          className='context-menu fixed bg-base-300 rounded-lg shadow-lg py-1 min-w-[200px] max-w-[280px] z-50 border border-base-200'
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`
          }}
          onClick={(e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onKeyDown={handleKeyDown}
        >
          <div role="menuitem" tabIndex={-1}>
            <Button
              fullWidth
              transparent
              alignLeft
              onClick={handlePlay}
              className={getButtonClassName(0)}
            >
              <i className='icon play mr-2' aria-hidden="true"></i>
              <span className="truncate">
                <Translate value='buttons.play' />
              </span>
            </Button>
          </div>

          {!disableAddButton && (
            <div role="menuitem" tabIndex={-1}>
              <Button
                fullWidth
                transparent
                alignLeft
                onClick={addToQueue}
                className={getButtonClassName(1)}
              >
                <Icon
                  icon='faPlusCircle'
                  className='mr-2'
                  aria-hidden="true"
                />
                <span className="truncate">
                  <Translate value='buttons.addToQueue' />
                </span>
              </Button>
            </div>
          )}

          {!disableAddButton && props.queue?.currentPlaying !== null && props.queue?.currentPlaying !== undefined && (
            <div role="menuitem" tabIndex={-1}>
              <Button
                fullWidth
                transparent
                alignLeft
                onClick={handleAddNext}
                className={getButtonClassName(disableAddButton ? 2 : 2)}
              >
                <Icon
                  icon='faPlusCircle'
                  className='mr-2'
                  aria-hidden="true"
                />
                <span className="truncate">
                  <Translate value='buttons.addNext' />
                </span>
              </Button>
            </div>
          )}

          {props.queue && props.queue.trackIds.includes(song.id) && (
            <div role="menuitem" tabIndex={-1}>
              <Button
                fullWidth
                transparent
                alignLeft
                onClick={removeFromQueue}
                className={getButtonClassName(menuItems.indexOf('removeFromQueue'))}
              >
                <i className='icon remove mr-2' aria-hidden="true"></i>
                <span className="truncate">
                  <Translate value='buttons.remove' />
                </span>
              </Button>
            </div>
          )}

          <div role="menuitem" tabIndex={-1}>
            <Button
              fullWidth
              transparent
              alignLeft
              onClick={removeFromDatabase}
              className={getButtonClassName(menuItems.indexOf('removeFromCollection'))}
            >
              <i className='icon remove mr-2' aria-hidden="true"></i>
              <span className="truncate">
                <Translate value='buttons.removeFromCollection' />
              </span>
            </Button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default ContextualMenu
