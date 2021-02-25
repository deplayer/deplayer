/**
 * Spectum audio visual thanks to
 * https://github.com/hu-ke/react-audio-spectrum
 */
import * as React from 'react'
import butterchurn from 'butterchurn'
import butterchurnPresets from 'butterchurn-presets'
import classnames from 'classnames'

import logger from '../utils/logger'

declare var AudioContext: any;

type Props = {
  spectrumId?: string,
  visualsId?: string,
  width?: number,
  height?: number,
  playerRef: HTMLAudioElement,
  capColor?: string,
  capHeight: number,
  meterWidth: number,
  meterCount: number,
  meterColor: any,
  gap: number,
  showSpectrum?: boolean,
  showVisuals?: boolean,
  visualsOnTop: boolean
}

class AudioSpectrum extends React.Component<Props> {
  static defaultProps = {
    width: 300,
    height: 200,
    capColor: '#FFF',
    capHeight: 2,
    meterWidth: 2,
    meterCount: 40 * (2 + 2),
    meterColor: [
      {stop: 0, color: '#f00'},
      {stop: 0.5, color: '#0CD7FD'},
      {stop: 1, color: 'red'}
    ],
    gap: 10, // gap between meters
  }

  animationId: any
  audioContext: any
  spectrumCanvas: any
  visualsCanvas: any
  playStatus: string | null
  spectrumCanvasId: string
  visualsCanvasId: string
  visualizer: any
  analyser: any

  constructor(props: Props) {
    super(props)

    this.animationId = null
    this.audioContext = null
    this.spectrumCanvas = null
    this.visualsCanvas = null
    this.playStatus = null
    this.visualizer = null
    this.analyser = null
    this.spectrumCanvasId = this.props.spectrumId || this.getRandomId(50)
    this.visualsCanvasId = this.props.visualsId || this.getRandomId(50)
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
    this.prepareAPIs()
    this.prepareElements()
    this.analyser = this.setupAudioNode(this.props.playerRef)
    this.initializeVisualizer()
    this.initAudioEvents(this.analyser)
  }

  initializeVisualizer = () => {
    if (this.props.showVisuals) {
      this.visualizer = butterchurn.createVisualizer(this.audioContext, this.visualsCanvas, {
        width: this.props.width,
        height: this.props.height
      })
      this.visualizer.connectAudio(this.analyser)
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.showSpectrum !== this.props.showSpectrum) {
      this.prepareElements()
      this.initializeVisualizer()
      this.initAudioEvents(this.analyser)
    }
    if (prevProps.showVisuals !== this.props.showVisuals) {
      this.prepareElements()
      this.initializeVisualizer()
      this.initAudioEvents(this.analyser)
    }
  }

  componentWillUnmount() {
    this.spectrumCanvas = null
    this.visualsCanvas = null
    this.audioContext = null
    this.visualizer = null
  }

  initAudioEvents = (analyser) => {
    const { showSpectrum, showVisuals } = this.props
    this.props.playerRef.onpause = (e) => {
      this.playStatus = 'PAUSED'
    }
    this.props.playerRef.onplay = (e) => {
      this.playStatus = 'PLAYING'
      if (showSpectrum) {
        this.drawSpectrum(analyser)
      }
      if (showVisuals) {
        const startRender = () => {
          this.visualizer.render()
          requestAnimationFrame(() => startRender())
        }

        const presets = butterchurnPresets.getPresets()
        const randomKey = Object.keys(presets)[Math.floor(Math.random() * Object.keys(presets).length)]
        const preset = presets[randomKey]

        if (this.visualizer) {
          console.log('setting size of:', this.props.width, this.props.height)
          this.visualizer.setRendererSize(this.props.width, this.props.height)
          this.visualizer.loadPreset(preset, 0.0) // 2nd argument is the number of seconds to blend presets
        }

        startRender()
      }
    }
  }

  drawSpectrum = (analyser) => {
    const cwidth = this.spectrumCanvas.width
    const cheight = this.spectrumCanvas.height - this.props.capHeight
    const capYPositionArray: Array<any> = [] // store the vertical position of hte caps for the preivous frame
    const ctx = this.spectrumCanvas.getContext('2d')
    let gradient = ctx.createLinearGradient(0, 0, 0, 300)

    if (this.props.meterColor.constructor === Array) {
      let stops = this.props.meterColor
      let len = stops.length
      for (let i = 0; i < len; i++) {
        gradient.addColorStop(stops[i]['stop'], stops[i]['color'])
      }
    } else if (typeof this.props.meterColor === 'string') {
      gradient = this.props.meterColor
    }

    const drawMeter = () => {
      const array = new Uint8Array(analyser.frequencyBinCount); // item value of array: 0 - 255
      analyser.getByteFrequencyData(array);
      if (this.playStatus === 'PAUSED') {
        for (let i = array.length - 1; i >= 0; i--) {
          array[i] = 0
        }
        const allCapsReachBottom = !capYPositionArray.some(cap => cap > 0)
        if (allCapsReachBottom) {
          ctx.clearRect(0, 0, cwidth, cheight + this.props.capHeight)
          cancelAnimationFrame(this.animationId) // since the sound is top and animation finished, stop the requestAnimation to prevent potential memory leak,THIS IS VERY IMPORTANT!
          return
        }
      }
      const step = Math.round(array.length / this.props.meterCount) // sample limited data from the total array
      ctx.clearRect(0, 0, cwidth, cheight + this.props.capHeight)
      for (let i = 0; i < this.props.meterCount; i++) {
        const value = array[i * step]
        if (capYPositionArray.length < Math.round(this.props.meterCount)) {
          capYPositionArray.push(value)
        }
        ctx.fillStyle = this.props.capColor
        // draw the cap, with transition effect
        if (value < capYPositionArray[i]) {
          // let y = cheight - (--capYPositionArray[i])
          const preValue = --capYPositionArray[i]
          const y = (270 - preValue) * cheight / 270
          ctx.fillRect(i * (this.props.meterWidth + this.props.gap), y, this.props.meterWidth, this.props.capHeight)
        } else {
          // let y = cheight - value
          const y = (270 - value) * cheight / 270
          ctx.fillRect(i * (this.props.meterWidth + this.props.gap), y, this.props.meterWidth, this.props.capHeight)
          capYPositionArray[i] = value
        };
        ctx.fillStyle = gradient; // set the filllStyle to gradient for a better look

        // let y = cheight - value + this.props.capHeight
        const y = (270 - value) * (cheight) / 270 + this.props.capHeight
        ctx.fillRect(i * (this.props.meterWidth + this.props.gap), y, this.props.meterWidth, cheight) // the meter
      }
      this.animationId = requestAnimationFrame(drawMeter)
    }
    this.animationId = requestAnimationFrame(drawMeter)
  }

  setupAudioNode = (audioEle: HTMLMediaElement) => {
    const analyser = this.audioContext.createAnalyser()
    analyser.smoothingTimeConstant = 0.8
    analyser.fftSize = 2048

    const mediaEleSource = this.audioContext.createMediaElementSource(audioEle)

    mediaEleSource.connect(analyser)
    mediaEleSource.connect(this.audioContext.destination);

    return analyser
  }

  prepareElements = () => {
    this.spectrumCanvas = document.getElementById(this.spectrumCanvasId)
    console.log('spectrumCanvas', this.spectrumCanvas)
    this.visualsCanvas = document.getElementById(this.visualsCanvasId)
    console.log('visualsCanvas', this.visualsCanvas)
  }

  prepareAPIs = () => {
    try {
      this.audioContext = new AudioContext() // 1.set audioContext
    } catch (e) {
      logger.log('!Your browser does not support AudioContext')
    }
  }

  render() {
    const { showSpectrum, showVisuals } = this.props

    const visualsClass = classnames({
      fixed: true,
      absolute: true,
      'z-50': this.props.visualsOnTop,
      'left-0': true,
      'right-0': true,
      'top-0': true,
      'bottom-0': true,
      'w-full': true,
      'h-full': true
    })

    return (
      <>
      { showVisuals && (
        <canvas
          className={visualsClass}
          id={this.visualsCanvasId}
          width={this.props.width}
          height={this.props.height}
        />
      )}
      { showSpectrum && (
        <canvas
          className='opacity-75'
          id={this.spectrumCanvasId}
          width={this.props.width}
          height={this.props.height}
        />
      )}
      </>
    )
  }
}

export default AudioSpectrum
