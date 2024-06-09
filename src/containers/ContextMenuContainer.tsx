import { connect } from 'react-redux'
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
      className={classNames({
        'justify-end': true,
        'items-center': true,
        flex: true
      })}
      style={{
        backgroundColor: 'transparent'
      }}
    >
      <ContextualMenu {...props} />
    </div>
  )
})

const ConnectedContextualMenuWithRouter = (props: any) => <ConnectedContextualMenu {...props} />

export default ConnectedContextualMenuWithRouter
