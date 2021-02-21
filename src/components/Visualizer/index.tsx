import React from 'react'
import butterchurn from 'butterchurn'
import butterchurnPresets from 'butterchurn-presets'

const enableVisualizer = (
  canvas: any,
  audioNode: any,
  width: number,
  height: number
) => {
  console.log('canvas: ', canvas)

  if (!canvas || !audioNode) {
    console.log('No audio or canvas found!')
    return
  }

  // initialize audioContext and get canvas
  const audioContext = new AudioContext()
  audioNode.crossOrigin = "anonymous"
  const source = audioContext.createMediaElementSource(audioNode)
  console.log('audioContext: ', audioContext)

  const visualizer = butterchurn.createVisualizer(audioContext, canvas, {
    width,
    height
  })

  // get audioNode from audio source or microphone

  console.log('connecting audio source', source)
  visualizer.connectAudio(source)
  source.connect(audioContext.destination)

  // load a preset
  const presets = butterchurnPresets.getPresets()
  const randomKey = Object.keys(presets)[Math.floor(Math.random() * Object.keys(presets).length)]
  console.log('random key: ', randomKey)
  const preset = presets[randomKey]
  console.log('selected preset: ', preset)

  visualizer.loadPreset(preset, 0.0) // 2nd argument is the number of seconds to blend presets

  // render a frame
  visualizer.render()

  // resize visualizer
  visualizer.setRendererSize(width, height)

  return visualizer
}

type Props = {
  player: any,
  playerRef: any,
  width: number,
  height: number
}

const Visualizer = (props: Props) => {
  const audioNode: any = props.playerRef

  // Select audioelement by provided selector
  if (!audioNode) {
    console.log('No audioNode')
    return null
  }

  const internalPlayer = audioNode.getInternalPlayer()

  const canvasRef = React.useCallback(node => {
    console.log('audioNode: ', audioNode)
    console.log('internalPlayer: ', internalPlayer)

    if (internalPlayer !== null && node !== null) {
      const visualizer = enableVisualizer(
        node,
        internalPlayer,
        props.width,
        props.height
      )

      visualizer.setRendererSize(600, 800)
    }
  }, [audioNode, internalPlayer])

  return (
    <canvas className='absolute left-0 right-0 top-0 bottom-0 w-full h-full z-50' ref={canvasRef} />
  )
}

export default Visualizer
