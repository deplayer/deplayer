/**
 * Spectum audio visual thanks to
 * https://github.com/hu-ke/react-audio-spectrum
 */
import * as React from 'react'
import logger from '../utils/logger'

declare var AudioContext: any;

type Props = {
  id?: string,
  width?: number,
  height?: number,
  audioSelector: string,
  capColor?: string,
  capHeight: number,
  meterWidth: number,
  meterCount: number,
  meterColor: any,
  gap: number,
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
  audioEle: any
  audioCanvas: any
  playStatus: string | null
  canvasId: string

  constructor(props: Props) {
    super(props)

    this.animationId = null
    this.audioContext = null
    this.audioEle = null
    this.audioCanvas = null
    this.playStatus = null
    this.canvasId = this.props.id || this.getRandomId(50)
  }

  getRandomId(len): string {
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

    if (this.audioEle) {
      const analyser = this.setupAudioNode(this.audioEle)
      this.initAudioEvents(analyser)
    }
  }

  componentWillUnmount() {
    this.audioEle = null
    this.audioCanvas = null
    this.audioContext = null
  }

  initAudioEvents = (analyser) => {
    this.audioEle.onpause = (e) => {
      this.playStatus = 'PAUSED'
    }
    this.audioEle.onplay = (e) => {
      this.playStatus = 'PLAYING'
      this.drawSpectrum(analyser)
    }
  }

  drawSpectrum = (analyser) => {
    const cwidth = this.audioCanvas.width
    const cheight = this.audioCanvas.height - this.props.capHeight
    const capYPositionArray: Array<any> = [] // store the vertical position of hte caps for the preivous frame
    const ctx = this.audioCanvas.getContext('2d')
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

  setupAudioNode = (audioEle) => {
    const analyser = this.audioContext.createAnalyser()
    analyser.smoothingTimeConstant = 0.8
    analyser.fftSize = 2048

    const mediaEleSource = this.audioContext.createMediaElementSource(audioEle)
    mediaEleSource.connect(analyser)
    mediaEleSource.connect(this.audioContext.destination);

    return analyser
  }

  prepareElements = () => {
    // Select audioelement by provided selector
    const selection = document.querySelectorAll(this.props.audioSelector);
    this.audioEle = Array.from(selection)[0]

    this.audioCanvas = document.getElementById(this.canvasId)
  }

  prepareAPIs = () => {
    try {
      this.audioContext = new AudioContext() // 1.set audioContext
    } catch (e) {
      logger.log('!Your browser does not support AudioContext')
    }
  }

  render() {
    return (
      <canvas
        id={this.canvasId}
        width={this.props.width}
        height={this.props.height}
      />
    )
  }
}

export default AudioSpectrum
