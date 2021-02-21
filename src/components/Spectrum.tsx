import * as React from 'react'
import { connect } from 'react-redux'
import AudioSpectrum from './AudioSpectrum'

type Props = {
  appSettings: any,
  playerRef: any
}
type State = {
  width: number
}

class Spectrum  extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { width: 0 };
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this)
  }

  componentDidMount() {
    this.updateWindowDimensions()
    window.addEventListener('resize', this.updateWindowDimensions)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions)
  }

  updateWindowDimensions() {
    this.setState({ width: window.innerWidth })
  }

  render () {
    const widthFactor = 8

    if (!this.props?.playerRef?.getInternalPlayer()) {
      return null
    }

    return (
      <AudioSpectrum
        id="audio-canvas"
        capColor={'red'}
        capHeight={2}
        meterWidth={this.state.width / (this.state.width / widthFactor)}
        meterCount={this.state.width}
        width={this.state.width}
        playerRef={this.props?.playerRef?.getInternalPlayer()}
        meterColor={[
          {stop: 0, color: '#f00'},
          {stop: 0.5, color: '#0CD7FD'},
          {stop: 1, color: 'red'}
        ]}
        gap={0.5}
      />
    )
  }
}

type ConnectState = {
  settings: any
}

export default connect(
  ({ settings }: ConnectState) => ({
    appSettings: settings
  })
)(Spectrum)
