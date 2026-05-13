const TOTAL_BARS = 32
const BAR_WIDTH = 12
const GAP = 4
const MAX_HEIGHT = 24

const SpectrumSVG = () => {
  const heights = Array(TOTAL_BARS).fill(0).map(() => Math.floor(Math.random() * MAX_HEIGHT))

  const totalWidth = TOTAL_BARS * (BAR_WIDTH + GAP)

  return (
    <svg 
      width="100%"
      height={MAX_HEIGHT}
      viewBox={`0 0 ${totalWidth} ${MAX_HEIGHT}`}
      preserveAspectRatio="none"
      className="opacity-20"
      aria-hidden="true"
    >
      {heights.map((height, index) => (
        <rect
          key={`bar-${index}`}
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