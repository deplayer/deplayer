import * as React from 'react'
import { connect } from 'react-redux'
import AudioSpectrum from './AudioSpectrum'
import { AutoSizer } from 'react-virtualized'
import { State as SettingsState } from '../reducers/settings'
import { State as AppState } from '../reducers/app'
import PlayerRefService from '../services/PlayerRefService'

type Props = {
  appSettings: SettingsState,
  app: AppState,
  visualizerOnTop: boolean
}

class Visualizer extends React.Component<Props> {
  componentDidMount() {
    console.log('Visualizer mounted')
    const media = PlayerRefService.getInstance().getCurrentMedia()
    console.log('Current media:', media)
    if (media?.element) {
      media.element.crossOrigin = 'anonymous'
      console.log('Set crossOrigin on media element')
    }
  }

  componentDidUpdate(prevProps: Props) {
    console.log('Visualizer updated', {
      showSpectrum: this.props.app.showSpectrum,
      showVisuals: this.props.app.showVisuals,
      prevShowSpectrum: prevProps.app.showSpectrum,
      prevShowVisuals: prevProps.app.showVisuals
    })
  }

  render() {
    const widthFactor = 10
    const playerRef = PlayerRefService.getInstance().getPlayerRef()
    const media = PlayerRefService.getInstance().getCurrentMedia()
    const internalPlayer = media?.element

    console.log('Visualizer render', {
      playerRef: !!playerRef,
      media: !!media,
      internalPlayer: !!internalPlayer,
      showSpectrum: this.props.app.showSpectrum,
      showVisuals: this.props.app.showVisuals
    })

    if (!internalPlayer || !(internalPlayer instanceof HTMLAudioElement || internalPlayer instanceof HTMLVideoElement)) {
      console.log('Visualizer: No valid internal player')
      return null
    }

    return (
      <div className="fixed inset-0 w-full h-full" style={{ zIndex: this.props.visualizerOnTop ? 50 : 1 }}>
        <AutoSizer>
          {({ height, width }) => {
            console.log('AutoSizer dimensions:', { height, width })
            return (
              <AudioSpectrum
                spectrumId="audio-canvas"
                visualsId="visuals"
                capColor={'red'}
                capHeight={40}
                meterWidth={width / (width / widthFactor)}
                meterCount={width / 2}
                width={width}
                height={height}
                playerRef={internalPlayer}
                showSpectrum={this.props.app.showSpectrum}
                showVisuals={this.props.app.showVisuals}
                visualsOnTop={this.props.visualizerOnTop}
                meterColor={[
                  { stop: 0, color: '#f00' },
                  { stop: 0.2, color: '#0CD7FD' },
                  { stop: 1, color: '#ecc94b' }
                ]}
                gap={1}
              />
            )
          }}
        </AutoSizer>
      </div>
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
