import * as React from 'react'
import { connect } from 'react-redux'
import AudioSpectrum from './AudioSpectrum'
import { AutoSizer } from 'react-virtualized'

type Props = {
  appSettings: any,
  app: any,
  playerRef: any,
  visualizerOnTop: boolean
}
class Visualizer extends React.Component<Props> {
  render() {
    const widthFactor = 8

    // FIXME: Temporary disable this component
    return null

    if (!this.props?.playerRef?.getInternalPlayer()) {
      return null
    }

    return (
      <AutoSizer>
        {({ height, width }) => (
          <AudioSpectrum
            spectrumId="audio-canvas"
            visualsId="visuals"
            capColor={'#ecc94b'}
            capHeight={2}
            meterWidth={width / (width / widthFactor)}
            meterCount={width}
            width={width}
            height={height}
            playerRef={this.props?.playerRef?.getInternalPlayer()}
            showSpectrum={this.props.app.showSpectrum}
            showVisuals={this.props.app.showVisuals}
            visualsOnTop={this.props.visualizerOnTop}
            meterColor={[
              { stop: 0, color: '#f00' },
              { stop: 0.5, color: '#0CD7FD' },
              { stop: 1, color: '#ecc94b' }
            ]}
            gap={0.5}
          />
        )}
      </AutoSizer>
    )
  }
}

type ConnectState = {
  settings: any,
  app: any
}

export default connect(
  ({ settings, app }: ConnectState) => ({
    appSettings: settings,
    app: app
  })
)(Visualizer)
