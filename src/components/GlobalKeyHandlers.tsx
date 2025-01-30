import { connect } from 'react-redux'
import { useEffect, useCallback } from 'react'
import { Dispatch } from 'redux'
import * as types from '../constants/ActionTypes'

type Props = {
  dispatch: Dispatch
}

const GlobalKeyHandlers = ({ dispatch }: Props) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Don't trigger if user is typing in an input or textarea
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return
    }

    switch (event.key) {
      case ' ':
        event.preventDefault() // Prevent space from scrolling the page
        dispatch({ type: types.TOGGLE_PLAYING })
        break
      case 'ArrowRight':
      case 'j':
        dispatch({ type: types.PLAY_NEXT })
        break
      case 'ArrowLeft':
      case 'k':
        dispatch({ type: types.PLAY_PREV })
        break
    }
  }, [dispatch])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  // This is a headless component that only handles keyboard events
  return null
}

export default connect()(GlobalKeyHandlers)
