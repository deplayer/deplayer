import * as React from 'react'
import classNames from 'classnames'
import butterchurn from 'butterchurn'
import butterchurnPresets from 'butterchurn-presets'
import screenfull from 'screenfull'
import { Translate } from 'react-redux-i18n'
import AudioContextService from '../../services/AudioContextService'
import Button from '../common/Button'
import Icon from '../common/Icon'
import {
  MOBILE_MAX_WIDTH,
  clampPanelPosition,
  nextSnappedPosition,
  panelContainerStyleFromPosition,
  type PanelPosition,
} from './panelPosition'

type Props = {
  playerRef: HTMLAudioElement
  className?: string
  pixelRatio?: number
  onClose: () => void
  onPositionChange?: (right: number | null, bottom: number, top: number | null) => void
}
const PANEL_WIDTH = 720
const PANEL_HEIGHT = 405

type PanelState = {
  isPresented: boolean
  isCssPresentation: boolean
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
  dragStartX: number = 0
  dragStartY: number = 0
  dragging: boolean = false
  dragMoved: boolean = false

  constructor(props: Props) {
    super(props)
    this.canvasId = this.getRandomId(50)
    this.state = {
      isPresented: false,
      isCssPresentation: false,
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
            if (this.canvas) {
              this.canvas.width = width
              this.canvas.height = height
            }
            if (this.visualizer) {
              this.visualizer.setRendererSize(width, height)
            }
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

  handleHeaderPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const btn = (e.target as HTMLElement).closest('button')
    if (btn) return

    // Capturing keeps move/up/cancel retargeted to the header for the whole
    // gesture; the React handlers below receive them.
    e.currentTarget.setPointerCapture(e.pointerId)

    this.dragStartX = e.clientX
    this.dragStartY = e.clientY
    this.dragging = true
    this.dragMoved = false

    // Visual cursor feedback via direct DOM class toggle (no React re-render)
    this.windowRef.current?.classList.add('is-dragging')
  }

  handlePointerMove = (e: React.PointerEvent) => {
    if (!this.dragging || !this.windowRef.current) return

    const dx = e.clientX - this.dragStartX
    const dy = e.clientY - this.dragStartY
    if (Math.abs(dx) + Math.abs(dy) > 4) {
      this.dragMoved = true
    }

    // The container is the fixed-positioned parent (.visualizer-panel-container)
    const container = this.windowRef.current.closest('.visualizer-panel-container') as HTMLElement | null
    if (!container) return

    const { right, bottom } = clampPanelPosition(
      container.getBoundingClientRect(),
      { width: window.innerWidth, height: window.innerHeight },
      dx,
      dy,
      window.innerWidth <= MOBILE_MAX_WIDTH
    )

    // Anchor to the right edge while dragging; clear left/top so a
    // left- or top-anchored panel can move. Safe-area insets keep the panel
    // clear of notches.
    container.style.left = 'auto'
    container.style.top = 'auto'
    container.style.right = `calc(${right}px + env(safe-area-inset-right))`
    container.style.bottom = `calc(${bottom}px + env(safe-area-inset-bottom))`

    // Reset delta anchor for next frame
    this.dragStartX = e.clientX
    this.dragStartY = e.clientY
  }

  handlePointerUp = () => {
    if (!this.dragging || !this.windowRef.current) return
    const container = this.windowRef.current.closest('.visualizer-panel-container') as HTMLElement | null
    const rect = container?.getBoundingClientRect()

    this.dragging = false
    this.windowRef.current?.classList.remove('is-dragging')

    // A click without real movement must not reposition the panel
    if (!this.dragMoved || !rect) return

    this.commitPosition(nextSnappedPosition(
      rect,
      { width: window.innerWidth, height: window.innerHeight },
      window.innerWidth <= MOBILE_MAX_WIDTH
    ))
  }

  handlePointerCancel = () => {
    // The browser took over the pointer (gesture interruption, system
    // back-swipe): drop the drag without committing a position.
    this.dragging = false
    this.windowRef.current?.classList.remove('is-dragging')
  }

  // Applies the committed anchored styles to the DOM directly (mirroring what
  // the store-driven render will produce) so no stale drag-time inline styles
  // survive when React's style diff skips an unchanged property, then commits
  // to the store. Pointer capture + React handlers keep the DOM mutation and
  // the store write in the same gesture.
  commitPosition = (position: PanelPosition) => {
    this.applyCommittedPosition(position.right, position.bottom, position.top)
    this.props.onPositionChange?.(position.right, position.bottom, position.top)
  }

  // Writes the committed anchored styles to the DOM directly (mirroring what
  // the store-driven render will produce) so no stale drag-time inline styles
  // survive when React's style diff skips an unchanged property.
  applyCommittedPosition = (right: number | null, bottom: number, top: number | null) => {
    const container = this.windowRef.current?.closest('.visualizer-panel-container') as HTMLElement | null
    if (!container) return
    const s = panelContainerStyleFromPosition(right, bottom, top)
    container.style.right = String(s.right ?? '')
    container.style.left = String(s.left ?? '')
    container.style.top = String(s.top ?? '')
    container.style.bottom = String(s.bottom ?? '')
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
        <div
          className="visualizer-panel-header flex items-center justify-between border-b border-base-300 shrink-0"
          onPointerDown={this.handleHeaderPointerDown}
          onPointerMove={this.handlePointerMove}
          onPointerUp={this.handlePointerUp}
          onPointerCancel={this.handlePointerCancel}
          style={{ touchAction: 'none', userSelect: 'none' }}
        >
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
