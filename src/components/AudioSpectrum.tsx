/**
 * Spectum audio visual thanks to
 * https://github.com/hu-ke/react-audio-spectrum
 */
import * as React from 'react'
import butterchurn from 'butterchurn'
import butterchurnPresets from 'butterchurn-presets'

import logger from '../utils/logger'

declare let AudioContext: any

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
  meterColor: { stop: number, color: string }[],
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
    meterCount: 20 * (2 + 2),
    meterColor: [
      { stop: 0, color: '#f00' },
      { stop: 0.5, color: '#0CD7FD' },
      { stop: 1, color: 'red' }
    ],
    gap: 10, // gap between meters
  }

  animationId: any
  audioContext: AudioContext | null
  spectrumCanvas: any
  visualsCanvas: any
  playStatus: string | null
  spectrumCanvasId: string
  visualsCanvasId: string
  visualizer: any
  analyser: any
  mediaSource: MediaElementAudioSourceNode | null = null;


  // Add static property to track sources
  private static audioSources = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();
  private static audioContext: AudioContext | null = null;

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
    if (this.props.showVisuals && this.visualsCanvas && this.audioContext) {
      try {
        // Reset canvas to clean state
        this.visualsCanvas.width = this.props.width
        this.visualsCanvas.height = this.props.height

        // Try WebGL2 first, then fallback to WebGL
        let gl = this.visualsCanvas.getContext('webgl2', {
          alpha: false,
          antialias: true,
          depth: true,
          preserveDrawingBuffer: true,
          stencil: true,
          premultipliedAlpha: false,
          powerPreference: 'high-performance'
        })

        if (!gl) {
          gl = this.visualsCanvas.getContext('webgl', {
            alpha: false,
            antialias: true,
            depth: true,
            preserveDrawingBuffer: true,
            stencil: true,
            premultipliedAlpha: false,
            powerPreference: 'high-performance'
          })
        }

        if (!gl) {
          console.error('WebGL not available')
          return
        }

        // Clear any previous state
        gl.viewport(0, 0, this.props.width, this.props.height)
        gl.clear(gl.COLOR_BUFFER_BIT)

        // Create visualizer with explicit context
        this.visualizer = butterchurn.createVisualizer(this.audioContext, this.visualsCanvas, {
          width: this.props.width,
          height: this.props.height,
          pixelRatio: window.devicePixelRatio || 1,
          contextAttributes: {
            alpha: false,
            antialias: true,
            depth: true,
            preserveDrawingBuffer: true,
            stencil: true,
            premultipliedAlpha: false,
            powerPreference: 'high-performance'
          }
        })

        if (this.visualizer && this.analyser) {
          this.visualizer.connectAudio(this.analyser)
          this.drawVisuals()
        }
      } catch (err) {
        console.error('Error setting up WebGL:', err)
      }
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.showSpectrum !== this.props.showSpectrum ||
        prevProps.showVisuals !== this.props.showVisuals ||
        prevProps.width !== this.props.width ||
        prevProps.height !== this.props.height) {
      
      // First cleanup any existing visualizations
      if (this.visualizer) {
        try {
          // Try to clean up old visualizer
          this.visualizer = null
        } catch (err) {
          console.error('Error cleaning up old visualizer:', err)
        }
      }

      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
        this.animationId = null
      }

      // Then prepare elements and reinitialize
      this.prepareElements()
      
      // Only initialize if we have valid canvases
      if ((this.props.showSpectrum && this.spectrumCanvas) || 
          (this.props.showVisuals && this.visualsCanvas)) {
        
        if (!this.analyser && this.audioContext) {
          this.analyser = this.setupAudioNode(this.props.playerRef)
        }

        if (this.props.showVisuals) {
          this.initializeVisualizer()
        }

        if (this.props.showSpectrum && this.spectrumCanvas && this.analyser) {
          this.initAudioEvents(this.analyser)
          if (this.props.playerRef.paused === false) {
            this.drawSpectrum(this.analyser)
          }
        }
      }
    }
  }

  componentWillUnmount() {
    if (this.analyser) {
      this.analyser.disconnect();
    }
    // Don't disconnect mediaSource as it's shared
    this.spectrumCanvas = null;
    this.visualsCanvas = null;
    this.audioContext = null;
    this.visualizer = null;
  }

  initAudioEvents = (analyser: AnalyserNode) => {
    const { showSpectrum, showVisuals } = this.props
    this.props.playerRef.onpause = () => {
      this.playStatus = 'PAUSED'
    }
    this.props.playerRef.onplay = () => {
      this.playStatus = 'PLAYING'
      if (showSpectrum) {
        this.drawSpectrum(analyser)
      }

      if (showVisuals) {
        this.drawVisuals()
      }
    }
  }

  drawVisuals = () => {
    if (!this.visualizer || !this.props.showVisuals) return

    const startRender = () => {
      if (this.visualizer && this.props.showVisuals) {
        try {
          this.visualizer.render()
          this.animationId = requestAnimationFrame(startRender)
        } catch (err) {
          console.error('Error in visualization render:', err)
          this.visualizer = null
          cancelAnimationFrame(this.animationId!)
        }
      }
    }

    try {
      const presets = butterchurnPresets.getPresets()
      const randomKey = Object.keys(presets)[Math.floor(Math.random() * Object.keys(presets).length)]
      const preset = presets[randomKey]

      this.visualizer.setRendererSize(this.props.width, this.props.height)
      this.visualizer.loadPreset(preset, 0.0)

      startRender()
    } catch (err) {
      console.error('Error starting visualization:', err)
      this.visualizer = null
    }
  }

  drawSpectrum = (analyser: AnalyserNode) => {
    const cwidth = this.spectrumCanvas.width
    const cheight = this.spectrumCanvas.height - this.props.capHeight
    const capYPositionArray: Array<number> = [] // store the vertical position of hte caps for the preivous frame
    const ctx = this.spectrumCanvas.getContext('2d')
    let gradient = ctx.createLinearGradient(0, 0, 0, 300)

    if (this.props.meterColor.constructor === Array) {
      const stops = this.props.meterColor
      const len = stops.length
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
        }
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
    if (!this.audioContext) {
      return
    }

    const analyser = this.audioContext.createAnalyser();
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 2048;

    let source = AudioSpectrum.audioSources.get(audioEle as HTMLAudioElement);

    if (!source) {
      source = this.audioContext.createMediaElementSource(audioEle);
      source && AudioSpectrum.audioSources.set(audioEle as HTMLAudioElement, source)
    }

    // Disconnect existing connections
    try {
      source.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }

    source.connect(analyser);
    source.connect(this.audioContext.destination);
    this.mediaSource = source;

    return analyser;
  }

  prepareElements = () => {
    if (this.props.showSpectrum) {
      this.spectrumCanvas = document.getElementById(this.spectrumCanvasId)
      if (this.spectrumCanvas) {
        this.spectrumCanvas.width = this.props.width
        this.spectrumCanvas.height = this.props.height
      }
    }
    
    if (this.props.showVisuals) {
      this.visualsCanvas = document.getElementById(this.visualsCanvasId)
      if (this.visualsCanvas) {
        // Remove any classes that might interfere with WebGL
        this.visualsCanvas.className = 'fixed inset-0'
        this.visualsCanvas.width = this.props.width
        this.visualsCanvas.height = this.props.height
      }
    }
  }

  prepareAPIs = () => {
    try {
      if (!AudioSpectrum.audioContext) {
        AudioSpectrum.audioContext = new AudioContext();
      }
      this.audioContext = AudioSpectrum.audioContext;
    } catch (e) {
      logger.log('!Your browser does not support AudioContext');
    }
  }

  render() {
    return (
      <>
        {this.props.showVisuals && (
          <canvas
            className="fixed inset-0"
            style={{ zIndex: this.props.visualsOnTop ? 50 : 1 }}
            id={this.visualsCanvasId}
            width={this.props.width}
            height={this.props.height}
          />
        )}
        {this.props.showSpectrum && (
          <canvas
            className="opacity-100"
            style={{ zIndex: 101 }}
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
