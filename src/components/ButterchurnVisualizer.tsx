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
  pixelRatio?: number,
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
  visualizer: { connectAudio: (node: AnalyserNode) => void; render: () => void; setRendererSize: (w: number, h: number) => void; loadPreset: (preset: unknown, blend: number) => void } | null = null
  analyser: AnalyserNode | null = null
  lastPresetIndex: number = -1

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

    // Mobile viewport changes (URL bar collapse, orientation) need the canvas
    // and renderer to track the new size.
    window.addEventListener('resize', this.handleResize)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
    if (this.visualizer) {
      this.visualizer = null
    }
    this.canvas = null
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.playerRef !== prevProps.playerRef) {
      this.loadRandomPreset()
    }
  }

  loadRandomPreset = () => {
    if (!this.visualizer) return
    try {
      const presets = butterchurnPresets.getPresets()
      const keys = Object.keys(presets)
      let index: number
      do {
        index = Math.floor(Math.random() * keys.length)
      } while (index === this.lastPresetIndex && keys.length > 1)
      this.lastPresetIndex = index
      this.visualizer.loadPreset(presets[keys[index]], 0.3)  // blend=0.3 for smooth cross-fade
    } catch (err) {
      console.error('Error cycling preset:', err)
    }
  }

  handleResize = () => {
    if (!this.canvas) return
    const w = window.innerWidth
    const h = window.innerHeight
    // Track the viewport even before/without a renderer (e.g. WebGL failed)
    this.canvas.width = w
    this.canvas.height = h
    this.visualizer?.setRendererSize(w, h)
  }

  initializeVisualizer = (audioContext: AudioContext) => {
    if (!this.canvas) return

    try {
      // Reset canvas to clean state
      this.canvas.width = this.props.width || 300
      this.canvas.height = this.props.height || 200

      const contextAttributes: WebGLContextAttributes = {
        alpha: true,
        antialias: true,
        depth: true,
        preserveDrawingBuffer: true,
        stencil: true,
        premultipliedAlpha: true,
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

      this.visualizer = butterchurn.createVisualizer(audioContext, this.canvas, {
        width,
        height,
        pixelRatio: this.props.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 1.5),
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

    // Under prefers-reduced-motion, throttle the ambient render loop to a calm
    // cadence (~10fps) instead of a full 60fps animation.
    const reducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const frameSkip = reducedMotion ? 5 : 0
    let frame = 0

    const startRender = () => {
      if (this.visualizer) {
        try {
          if (frame === 0) {
            this.visualizer.render()
          }
          frame = (frame + 1) % (frameSkip + 1)
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
      this.visualizer.setRendererSize(this.props.width || 300, this.props.height || 200)
      this.loadRandomPreset()

      startRender()
    } catch (err) {
      console.error('Error starting visualization:', err)
      this.visualizer = null
    }
  }

  prepareElements = () => {
    this.canvas = document.getElementById(this.canvasId) as HTMLCanvasElement
    if (this.canvas) {
      // Position/size come from the JSX className and props; don't mutate
      // className here — React won't re-apply an unchanged class prop after
      // mount, so wiping it would permanently drop 'fixed inset-0'.
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

    // Ambient background: subtle atmosphere while keeping content readable
    const canvasStyle: React.CSSProperties = {
      opacity: 0.5,
      mixBlendMode: 'screen',
      filter: 'blur(1px) saturate(1.3) brightness(1.1)',
      pointerEvents: 'none',
    }

    return (
      <canvas
        className={canvasClasses}
        id={this.canvasId}
        width={this.props.width}
        height={this.props.height}
        style={canvasStyle}
        onMouseMove={onMouseMove}
        aria-hidden='true'
      />
    )
  }
}

export default ButterchurnVisualizer 