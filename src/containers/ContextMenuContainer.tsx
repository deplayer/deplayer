import { connect } from 'react-redux'
import classNames from 'classnames'
import ContextualMenu from '../components/Player/ContextualMenu'

const ConnectedContextualMenu = connect(
  (state: any) => ({
    app: state.app,
    slim: state.app.slimPlayer,
    player: state.player,
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
