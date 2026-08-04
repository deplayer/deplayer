import * as React from 'react'
import classNames from 'classnames'
import butterchurn from 'butterchurn'
import butterchurnPresets from 'butterchurn-presets'
import screenfull from 'screenfull'
import { Translate } from 'react-redux-i18n'
import AudioContextService from '../../services/AudioContextService'
import Button from '../common/Button'
import Icon from '../common/Icon'

type Props = {
  playerRef: HTMLAudioElement
  className?: string
  pixelRatio?: number
  onClose: () => void
}
const PANEL_WIDTH = 720
const PANEL_HEIGHT = 405

type PanelState = {
  isPresented: boolean
  isCssPresentation: boolean
  canvasWidth: number
  canvasHeight: number
}

class VisualizerPanel extends React.Component<Props, PanelState> {
  animationId: number | null = null
  canvas: HTMLCanvasElement | null = null
  canvasId: string
  visualizer: {
    connectAudio: (node: AnalyserNode) => void
    render: () => void
    setRendererSize: (w: number, h: number) => void
    loadPreset: (preset: unknown, blend: number) => void
  } | null = null
  analyser: AnalyserNode | null = null
  lastPresetIndex: number = -1
  windowRef = React.createRef<HTMLDivElement>()
  containerRef = React.createRef<HTMLDivElement>()
  resizeObserver: ResizeObserver | null = null

  constructor(props: Props) {
    super(props)
    this.canvasId = this.getRandomId(50)
    this.state = {
      isPresented: false,
      isCssPresentation: false,
      canvasWidth: PANEL_WIDTH,
      canvasHeight: PANEL_HEIGHT,
    }
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

    // ResizeObserver for dynamic canvas sizing
    if (typeof ResizeObserver !== 'undefined' && this.containerRef.current) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          if (width > 0 && height > 0) {
            this.setState({ canvasWidth: width, canvasHeight: height }, () => {
              if (this.canvas) {
                this.canvas.width = width
                this.canvas.height = height
              }
              if (this.visualizer) {
                this.visualizer.setRendererSize(width, height)
              }
            })
          }
        }
      })
      this.resizeObserver.observe(this.containerRef.current)
    }

    // Fullscreen change listener
    document.addEventListener('fullscreenchange', this.handleFullscreenChange)
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.playerRef !== this.props.playerRef) {
      const audioContext = AudioContextService.getInstance().getAudioContext()
      this.analyser = AudioContextService.getInstance().getAnalyser(this.props.playerRef)
      if (audioContext && this.analyser && this.visualizer) {
        this.visualizer.connectAudio(this.analyser)
      }
    }
  }

  componentWillUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange)
  }

  handleFullscreenChange = () => {
    const isNativeFullscreen = screenfull.isEnabled && !!document.fullscreenElement
    if (!isNativeFullscreen) {
      this.setState({ isPresented: false, isCssPresentation: false })
    } else {
      this.setState({ isPresented: true, isCssPresentation: false })
    }
  }

  handlePresentToggle = async () => {
    const { isPresented, isCssPresentation } = this.state

    // If already in native fullscreen, exit
    if (isPresented && !isCssPresentation) {
      if (screenfull.isEnabled) {
        await screenfull.exit()
      }
      return
    }

    // If in CSS fallback, just turn it off
    if (isCssPresentation) {
      this.setState({ isPresented: false, isCssPresentation: false })
      return
    }

    // Try native fullscreen
    if (screenfull.isEnabled && this.windowRef.current) {
      try {
        await screenfull.request(this.windowRef.current)
      } catch {
        // Native fullscreen rejected — use CSS fallback
        this.setState({ isPresented: true, isCssPresentation: true })
      }
    } else {
      // Fullscreen API unavailable — use CSS fallback
      this.setState({ isPresented: true, isCssPresentation: true })
    }
  }

  handleClose = () => {
    // If currently presenting, exit first
    if (this.state.isPresented && !this.state.isCssPresentation && screenfull.isEnabled) {
      screenfull.exit()
    }
    this.props.onClose()
  }

  initializeVisualizer = (audioContext: AudioContext) => {
    if (!this.canvas) return

    try {
      const w = this.containerRef.current?.clientWidth || PANEL_WIDTH
      const h = this.containerRef.current?.clientHeight || PANEL_HEIGHT
      this.canvas.width = w
      this.canvas.height = h

      const contextAttributes: WebGLContextAttributes = {
        alpha: true,
        antialias: true,
        depth: true,
        preserveDrawingBuffer: true,
        stencil: true,
        premultipliedAlpha: true,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
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

      gl.viewport(0, 0, w, h)
      gl.clear(gl.COLOR_BUFFER_BIT)

      this.visualizer = butterchurn.createVisualizer(audioContext, this.canvas, {
        width: w,
        height: h,
        pixelRatio: this.props.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 1.5),
        contextAttributes,
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
      const w = this.containerRef.current?.clientWidth || PANEL_WIDTH
      const h = this.containerRef.current?.clientHeight || PANEL_HEIGHT
      this.visualizer.setRendererSize(w, h)
      this.loadRandomPreset()

      startRender()
    } catch (err) {
      console.error('Error starting visualization:', err)
      this.visualizer = null
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
      this.visualizer.loadPreset(presets[keys[index]], 0.3)
    } catch (err) {
      console.error('Error cycling preset:', err)
    }
  }

  prepareElements = () => {
    this.canvas = document.getElementById(this.canvasId) as HTMLCanvasElement
    if (this.canvas) {
      const w = this.containerRef.current?.clientWidth || PANEL_WIDTH
      const h = this.containerRef.current?.clientHeight || PANEL_HEIGHT
      this.canvas.width = w
      this.canvas.height = h
    }
  }

  render() {
    const { isPresented, isCssPresentation } = this.state

    const windowClasses = classNames(
      'visualizer-panel-window',
      'bg-base-200 rounded-lg shadow-xl border border-base-300 overflow-hidden',
      'flex flex-col',
      {
        'is-presenting': isCssPresentation,
      },
      this.props.className
    )

    const presentLabel = isPresented
      ? 'buttons.exitVisualsPresentation'
      : 'buttons.presentVisuals'
    const presentIcon = isPresented ? 'faCompress' : 'faExpand'

    return (
      <div
        ref={this.windowRef}
        className={windowClasses}
      >
        <div className="visualizer-panel-header flex items-center justify-between border-b border-base-300 shrink-0">
          <span className="font-medium text-base-content/80">
            <Translate value="buttons.visualizerTitle" />
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              transparent
              size="xs"
              onClick={this.handlePresentToggle}
              aria-label={presentLabel}
            >
              <Icon icon={presentIcon} />
            </Button>
            <Button
              transparent
              size="xs"
              onClick={this.loadRandomPreset}
              aria-label="buttons.nextVisualPreset"
            >
              <Icon icon="faMagic" />
            </Button>
            <Button
              transparent
              size="xs"
              onClick={this.handleClose}
              aria-label="buttons.closeVisuals"
            >
              <Icon icon="faTimes" />
            </Button>
          </div>
        </div>
        <div
          ref={this.containerRef}
          className="visualizer-panel-canvas-container flex-1 min-h-0"
          aria-hidden="true"
        >
          <canvas
            id={this.canvasId}
            width={PANEL_WIDTH}
            height={PANEL_HEIGHT}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      </div>
    )
  }
}

export default VisualizerPanel
