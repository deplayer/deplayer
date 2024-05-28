import { connect } from 'react-redux'
import Collection from '../components/Collection'

import * as reactRouter from 'react-router'
reactRouter.use


export default connect(
  (state: any, ownProps: any) => ({
    app: state.app,
    queue: state.queue,
    player: state.player,
    collection: state.collection,
    location: ownProps.location,
    backgroundImage: state.app.backgroundImage,
    visibleSongs: state.collection.visibleSongs
  })
)(Collection)
