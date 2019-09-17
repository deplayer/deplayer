import * as React from 'react'
import { connect } from 'react-redux'

import { State } from '../../reducers/player'

type Props = {
  player: State,
}

const Placeholder = (props: Props) => {
  if (!props.player.showPlayer) {
    return null
  }

  return (
    <div className='placeholder'>
    </div>
  )
}

export default connect(
  (state: Props) => ({
    player: state.player
  })
)(Placeholder)
