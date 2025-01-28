import * as React from 'react'
import classNames from 'classnames'
import butterchurn from 'butterchurn'
import butterchurnPresets from 'butterchurn-presets'
import AudioContextService from '../services/AudioContextService'
import { Dispatch } from 'redux'
import * as types from '../constants/ActionTypes'
import screenfull from 'screenfull'

type Props = {
  width?: number,
  height?: number,
  playerRef: HTMLAudioElement,
  fullscreen: boolean,
  dispatch: Dispatch
}

class ButterchurnVisualizer extends React.Component<Props> {
  static defaultProps = {
    width: 300,
    height: 200
  }

  animationId: number | null = null
  canvas: HTMLCanvasElement | null = null
  canvasId: string
  visualizer: any
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
    const audioContext = AudioContextService.getInstance().getAudioContext()
    this.analyser = AudioContextService.getInstance().getAnalyser(this.props.playerRef)
    if (audioContext && this.analyser) {
      this.initializeVisualizer(audioContext)
    }
  }

  componentWillUnmount() {
    if (this.visualizer) {
      this.visualizer = null
    }
    this.canvas = null
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }

  initializeVisualizer = (audioContext: AudioContext) => {
    if (!this.canvas) return

    try {
      // Reset canvas to clean state
      this.canvas.width = this.props.width || 300
      this.canvas.height = this.props.height || 200

      const contextAttributes: WebGLContextAttributes = {
        alpha: false,
        antialias: true,
        depth: true,
        preserveDrawingBuffer: true,
        stencil: true,
        premultipliedAlpha: false,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false
      }

      // Try WebGL2 first, then fallback to WebGL
      const gl = (
        this.canvas.getContext('webgl2', contextAttributes) ||
        this.canvas.getContext('webgl', contextAttributes) ||
        this.canvas.getContext('experimental-webgl', contextAttributes)
      ) as WebGLRenderingContext | null

      if (!gl) {
        console.error('WebGL not available')
        return
      }

      // Clear any previous state
      const width = this.props.width || 300
      const height = this.props.height || 200
      gl.viewport(0, 0, width, height)
      gl.clear(gl.COLOR_BUFFER_BIT)

      // Create visualizer with explicit context
      this.visualizer = butterchurn.createVisualizer(audioContext, this.canvas, {
        width,
        height,
        pixelRatio: window.devicePixelRatio || 1,
        contextAttributes
      })

      if (this.visualizer && this.analyser) {
        this.visualizer.connectAudio(this.analyser)
        this.drawVisuals()
      }
    } catch (err) {
      console.error('Error setting up WebGL:', err)
    }
  }

  drawVisuals = () => {
    if (!this.visualizer) return

    const startRender = () => {
      if (this.visualizer) {
        try {
          this.visualizer.render()
          this.animationId = requestAnimationFrame(startRender)
        } catch (err) {
          console.error('Error in visualization render:', err)
          this.visualizer = null
          if (this.animationId) {
            cancelAnimationFrame(this.animationId)
          }
        }
      }
    }

    try {
      const presets = butterchurnPresets.getPresets()
      const randomKey = Object.keys(presets)[Math.floor(Math.random() * Object.keys(presets).length)]
      const preset = presets[randomKey]

      this.visualizer.setRendererSize(this.props.width || 300, this.props.height || 200)
      this.visualizer.loadPreset(preset, 0.0)

      startRender()
    } catch (err) {
      console.error('Error starting visualization:', err)
      this.visualizer = null
    }
  }

  prepareElements = () => {
    this.canvas = document.getElementById(this.canvasId) as HTMLCanvasElement
    if (this.canvas) {
      // Remove any classes that might interfere with WebGL
      this.canvas.className = 'fixed inset-0'
      this.canvas.width = this.props.width || 300
      this.canvas.height = this.props.height || 200
    }
  }

  render() {
    const onMouseMove = () => {
        this.props.dispatch({ type: types.SHOW_PLAYER })
    }

    const fullscreen = screenfull.isEnabled && screenfull.isFullscreen

    const canvasClasses = classNames({
      'fixed inset-0': true,
      'z-50': fullscreen,
      'z-0': !fullscreen
    })

    return (
      <canvas
        className={canvasClasses}
        id={this.canvasId}
        width={this.props.width}
        height={this.props.height}
        onMouseMove={onMouseMove}
      />
    )
  }
}

export default ButterchurnVisualizer 