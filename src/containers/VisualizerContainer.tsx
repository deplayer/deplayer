import { connect } from 'react-redux'
import React from 'react'
import { AutoSizer } from 'react-virtualized'

import Visualizer from '../components/Visualizer'

export default connect(
  (state: any) => {
    return {
      player: state.player
    }
  }
)((props: any): any => (
  <AutoSizer>
    {({ height, width }) => (
      <Visualizer {...props} height={height} width={width} />
    )}
  </AutoSizer>
))
