import classNames from 'classnames'
import React, { useEffect, useState } from 'react'

type Props = {
  src?: string
  reflect?: boolean
  onClick?: () => void
  children: React.ReactNode
}

const LazyImage: React.FC<Props> = ({ src, reflect, onClick, children }) => {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const image = new Image()

    const handleLoad = () => {
      if (isMounted) {
        setLoading(false)
      }
    }

    const handleError = () => {
      if (isMounted) {
        setError(`Failed to load ${src}`)
        setLoading(false)
      }
    }

    image.onload = handleLoad
    image.onerror = handleError

    if (src) {
      image.src = src
    }

    setLoading(true)

    return () => {
      isMounted = false
    }
  }, [src, setError, setLoading ])

  const childrenWithProps = React.Children.map(children, (child: any) =>
    React.cloneElement(child, {
      noImage: error || loading
    })
  )

  const className = classNames({
    "lazy-image": true,
    "fade-in": true,
    "w-full": true,
    "bg-no-repeat": true,
    "bg-center": true,
    "cursor-pointer": true,
    "reflected-image": reflect,
    one: true
  })

  return (
    <div className={className} onClick={onClick}>
      {childrenWithProps}
    </div>
  )
}

export default LazyImage
