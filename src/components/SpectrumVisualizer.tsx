import * as React from 'react'
import AudioContextService from '../services/AudioContextService'

type Props = {
  width?: number,
  height?: number,
  playerRef: HTMLAudioElement,
  capColor?: string,
  capHeight: number,
  meterWidth: number,
  meterCount: number,
  meterColor: Array<{ stop: number, color: string }>,
  gap: number
}

class SpectrumVisualizer extends React.Component<Props> {
  static defaultProps = {
    width: 300,
    height: 200,
    capColor: '#FFF',
    capHeight: 2,
    meterWidth: 2,
    meterCount: 20 * (2 + 2),
    meterColor: [
      { stop: 0, color: '#f00' },
      { stop: 0.5, color: '#0CD7FD' },
      { stop: 1, color: 'red' }
    ],
    gap: 10,
  }

  animationId: number | null = null
  canvas: HTMLCanvasElement | null = null
  playStatus: string | null = null
  canvasId: string
  analyser: AnalyserNode | null = null

  constructor(props: Props) {
    super(props)
    this.canvasId = this.getRandomId(50)
  }

  getRandomId(len: number): string {
    const str = '1234567890-qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM'
    const strLen = str.length
    let res = ''
    for (let i = 0; i < len; i++) {
      const randomIndex = Math.floor((Math.random() * strLen))
      res += str[randomIndex]
    }
    return res
  }

  componentDidMount() {
    this.prepareElements()
    this.analyser = AudioContextService.getInstance().getAnalyser(this.props.playerRef)
    if (this.analyser) {
      this.initAudioEvents(this.analyser)
    }
  }

  componentWillUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }

  initAudioEvents = (analyser: AnalyserNode) => {
    this.props.playerRef.onpause = () => {
      this.playStatus = 'PAUSED'
    }
    this.props.playerRef.onplay = () => {
      this.playStatus = 'PLAYING'
      this.drawSpectrum(analyser)
    }
  }

  drawSpectrum = (analyser: AnalyserNode) => {
    if (!this.canvas) return

    const cwidth = this.canvas.width
    const cheight = this.canvas.height - this.props.capHeight
    const capYPositionArray: Array<number> = []
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return

    let gradient: CanvasGradient | string = ctx.createLinearGradient(0, 0, 0, 300)

    if (this.props.meterColor.length > 0) {
      const stops = this.props.meterColor
      for (const stop of stops) {
        gradient.addColorStop(stop.stop, stop.color)
      }
    } else {
      gradient = '#f00' // Fallback color if no stops provided
    }

    const drawMeter = () => {
      const array = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(array)
      
      if (this.playStatus === 'PAUSED') {
        for (let i = array.length - 1; i >= 0; i--) {
          array[i] = 0
        }
        const allCapsReachBottom = !capYPositionArray.some(cap => cap > 0)
        if (allCapsReachBottom) {
          ctx.clearRect(0, 0, cwidth, cheight + this.props.capHeight)
          if (this.animationId) {
            cancelAnimationFrame(this.animationId)
          }
          return
        }
      }

      const step = Math.round(array.length / this.props.meterCount)
      ctx.clearRect(0, 0, cwidth, cheight + this.props.capHeight)

      for (let i = 0; i < this.props.meterCount; i++) {
        const value = array[i * step]
        if (capYPositionArray.length < Math.round(this.props.meterCount)) {
          capYPositionArray.push(value)
        }

        const { meterWidth, gap, capHeight } = this.props
        ctx.fillStyle = this.props.capColor || '#FFF'
        if (value < capYPositionArray[i]) {
          const preValue = --capYPositionArray[i]
          const y = (270 - preValue) * cheight / 270
          ctx.fillRect(i * (meterWidth + gap), y, meterWidth, capHeight)
        } else {
          const y = (270 - value) * cheight / 270
          ctx.fillRect(i * (meterWidth + gap), y, meterWidth, capHeight)
          capYPositionArray[i] = value
        }

        ctx.fillStyle = gradient
        const y = (270 - value) * (cheight) / 270 + capHeight
        ctx.fillRect(i * (meterWidth + gap), y, meterWidth, cheight)
      }
      this.animationId = requestAnimationFrame(drawMeter)
    }
    this.animationId = requestAnimationFrame(drawMeter)
  }

  prepareElements = () => {
    this.canvas = document.getElementById(this.canvasId) as HTMLCanvasElement
    if (this.canvas) {
      this.canvas.width = this.props.width || 300
      this.canvas.height = this.props.height || 200
    }
  }

  render() {
    return (
      <canvas
        className="opacity-100"
        style={{ zIndex: 101 }}
        id={this.canvasId}
        width={this.props.width}
        height={this.props.height}
      />
    )
  }
}

export default SpectrumVisualizer 
