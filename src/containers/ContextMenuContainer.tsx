import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import classNames from 'classnames'
import ContextualMenu from '../components/Player/ContextualMenu'

const ConnectedContextualMenu = connect(
  (state: any) => ({
    app: state.app,
    settings: state.settings,
    slim: state.app.slimPlayer,
    player: state.player,
    queue: state.queue,
    collection: state.collection,
    itemCount: state.queue.trackIds ? state.queue.trackIds.length : 0
  })
)((props: any) => {
  return (
    <div
      className={ classNames({
        'player-container': true,
        'justify-end': true,
        flex: true
      })}
      style={{
        zIndex: 102,
        backgroundColor: 'transparent'
      }}
    >
      <ContextualMenu {...props} />
    </div>
  )
})

const RoutedPlayer = withRouter((props: any) => <ConnectedContextualMenu {...props}/>)

export default RoutedPlayer
