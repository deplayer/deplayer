import { connect } from 'react-redux'
import classNames from 'classnames'

import { State } from '../../reducers/player'

type Props = {
  player: State,
  mqlMatch?: boolean
}

const Placeholder = (props: Props) => {
  if (!props.player.showPlayer) {
    return null
  }

  const classes = classNames({
    placeholder: true,
    small: !props.mqlMatch
  })

  return (
    <div className={classes}>
    </div>
  )
}

export default connect(
  (state: Props) => ({
    player: state.player
  })
)(Placeholder)
