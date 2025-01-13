import React, { useEffect, useState } from 'react'

const TOTAL_BARS = 32
const BAR_WIDTH = 12
const GAP = 4
const MAX_HEIGHT = 24

const SpectrumSVG = () => {
  const [heights, setHeights] = useState<number[]>(Array(TOTAL_BARS).fill(0))

  useEffect(() => {
    const interval = setInterval(() => {
      setHeights(heights => 
        heights.map(() => Math.floor(Math.random() * MAX_HEIGHT))
      )
    }, 300)

    return () => clearInterval(interval)
  }, [])

  const totalWidth = TOTAL_BARS * (BAR_WIDTH + GAP)

  return (
    <svg 
      width={totalWidth} 
      height={MAX_HEIGHT} 
      className="opacity-30"
      aria-hidden="true"
    >
      {heights.map((height, index) => (
        <rect
          key={index}
          x={index * (BAR_WIDTH + GAP)}
          y={MAX_HEIGHT - height}
          width={BAR_WIDTH}
          height={height}
          className="fill-primary"
          rx={2}
        />
      ))}
    </svg>
  )
}

export default SpectrumSVG 