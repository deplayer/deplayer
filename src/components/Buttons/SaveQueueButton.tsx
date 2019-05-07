import * as React from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'

import { SAVE_PLAYLIST } from '../../constants/ActionTypes'

type Props = {
  dispatch: Dispatch,
  queue: any
}

const SaveQueueButton = (props: Props) => {
  if (!props.queue.trackIds.length) {
    return null
  }

  const saveQueue = () => {
    const playlistName = window.prompt('Set playlist name')
    props.dispatch({type: SAVE_PLAYLIST, name: playlistName})
  }

  return (
    <button
      className='clearqueue-button button'
      onClick={saveQueue}
    >
      <i className='fa fa-save'></i>
    </button>
  )
}

export default connect(
  (state) => ({
    queue: state.queue
  })
)(SaveQueueButton)
