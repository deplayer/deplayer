import * as React from 'react'

declare var AudioContext: any;

type Props = {
  id?: string,
  width?: number,
  height?: number,
  audioId: string,
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
    let analyser = this.setupAudioNode(this.audioEle)
    this.initAudioEvents(analyser)
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
    let cwidth = this.audioCanvas.width
    let cheight = this.audioCanvas.height - this.props.capHeight
    const capYPositionArray: Array<any> = [] // store the vertical position of hte caps for the preivous frame
    let ctx = this.audioCanvas.getContext('2d')
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

    let drawMeter = () => {
      let array = new Uint8Array(analyser.frequencyBinCount); // item value of array: 0 - 255
      analyser.getByteFrequencyData(array);
      if (this.playStatus === 'PAUSED') {
        for (let i = array.length - 1; i >= 0; i--) {
          array[i] = 0
        }
        let allCapsReachBottom = !capYPositionArray.some(cap => cap > 0)
        if (allCapsReachBottom) {
          ctx.clearRect(0, 0, cwidth, cheight + this.props.capHeight)
          cancelAnimationFrame(this.animationId) // since the sound is top and animation finished, stop the requestAnimation to prevent potential memory leak,THIS IS VERY IMPORTANT!
          return
        }
      }
      let step = Math.round(array.length / this.props.meterCount) // sample limited data from the total array
      ctx.clearRect(0, 0, cwidth, cheight + this.props.capHeight)
      for (let i = 0; i < this.props.meterCount; i++) {
        let value = array[i * step]
        if (capYPositionArray.length < Math.round(this.props.meterCount)) {
          capYPositionArray.push(value)
        };
        ctx.fillStyle = this.props.capColor
        // draw the cap, with transition effect
        if (value < capYPositionArray[i]) {
          // let y = cheight - (--capYPositionArray[i])
          let preValue = --capYPositionArray[i]
          let y = (270 - preValue) * cheight / 270
          ctx.fillRect(i * (this.props.meterWidth + this.props.gap), y, this.props.meterWidth, this.props.capHeight)
        } else {
          // let y = cheight - value
          let y = (270 - value) * cheight / 270
          ctx.fillRect(i * (this.props.meterWidth + this.props.gap), y, this.props.meterWidth, this.props.capHeight)
          capYPositionArray[i] = value
        };
        ctx.fillStyle = gradient; // set the filllStyle to gradient for a better look

        // let y = cheight - value + this.props.capHeight
        let y = (270 - value) * (cheight) / 270 + this.props.capHeight
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

    let mediaEleSource = this.audioContext.createMediaElementSource(audioEle)
    mediaEleSource.connect(analyser)
    mediaEleSource.connect(this.audioContext.destination);

    return analyser
  }

  prepareElements = () => {
    this.audioEle = document.getElementById(this.props.audioId)
    this.audioCanvas = document.getElementById(this.canvasId)
  }

  prepareAPIs = () => {
    try {
      this.audioContext = new AudioContext() // 1.set audioContext
    } catch (e) {
      // console.error('!Your browser does not support AudioContext')
      console.log(e);
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
