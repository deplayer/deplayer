import classNames from 'classnames'
import React, { useEffect, useState, useRef } from 'react'

type Props = {
  src?: string
  reflect?: boolean
  onClick?: () => void
  children: React.ReactNode
  noFade?: boolean
}

const LazyImage: React.FC<Props> = ({ src, reflect, onClick, children, noFade }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setIsLoaded(false)
    setHasError(false)
    setShowFallback(false)

    if (!src) return

    // Clear any existing timer
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current)
    }

    // Set a timer to show fallback if loading takes too long
    fallbackTimer.current = setTimeout(() => {
      if (!isLoaded) {
        setShowFallback(true)
      }
    }, 150) // Small delay to avoid flashing during fast scrolling

    const img = new Image()
    img.crossOrigin = 'anonymous' // Required for COEP compatibility
    img.onload = () => {
      setIsLoaded(true)
      setShowFallback(false)
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current)
      }
    }
    img.onerror = () => {
      setHasError(true)
      setShowFallback(true)
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current)
      }
    }
    img.src = src

    return () => {
      img.onload = null
      img.onerror = null
      if (fallbackTimer.current) {
        clearTimeout(fallbackTimer.current)
      }
    }
  }, [src])

  const childrenWithProps = React.Children.map(children, (child: any) =>
    React.cloneElement(child, {
      noImage: (showFallback && !isLoaded) || hasError,
      src: isLoaded && !hasError ? src : undefined,
      isLoaded,
      noFade
    })
  )

  const className = classNames({
    "lazy-image": true,
    "w-full": true,
    "bg-no-repeat": true,
    "bg-center": true,
    "cursor-pointer": true,
    "reflected-image": reflect
  })

  return (
    <div className={className} onClick={onClick}>
      {childrenWithProps}
    </div>
  )
}

export default React.memo(LazyImage)
