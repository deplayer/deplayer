import { Dispatch } from 'redux'
import { Translate } from 'react-redux-i18n'
import { connect } from 'react-redux'
import * as React from 'react'

import { SAVE_PLAYLIST } from '../../constants/ActionTypes'
import Button from '../common/Button'

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
    <Button
      transparent
      className='clearqueue-button button'
      onClick={saveQueue}
    >
      <i className='fa fa-save mr-2'></i>
      <Translate className='hidden md:inline' value='buttons.saveAsPlaylist' />
    </Button>
  )
}

export default connect(
  (state: { queue: any }) => ({
    queue: state.queue
  })
)(SaveQueueButton)
