import { Dispatch, connect } from 'react-redux'
import React from 'react'

import Button from '../common/Button'
import Modal from '../common/Modal'
import * as types from '../../constants/ActionTypes'

type Props = {
  showAddMediaModal: boolean,
  dispatch: Dispatch
}

const AddMediaModal = (props: Props) => {
  const [magnetLink, setMagnetLink] = React.useState('')

  if (!props.showAddMediaModal) {
    return null
  }

  return (
    <Modal
      onClose={() => {
        props.dispatch({type: types.HIDE_ADD_MEDIA_MODAL})
      }}
    >
      <h2>Select media to add:</h2>
      <h3>Magnet link</h3>

      <input
        type="text"
        value={magnetLink}
        onChange={(event) => setMagnetLink(event.target.value)}
      />
      <Button
        type='submit'
        onClick={() => {
          props.dispatch({type: types.ADD_WEBTORRENT_MEDIA, magnet: magnetLink})
          props.dispatch({type: types.HIDE_ADD_MEDIA_MODAL})
        }}
      >
        Add
      </Button>
    </Modal>
  )
}

export default connect(
  (state: any) => ({
    showAddMediaModal: state.app.showAddMediaModal
  })
)(AddMediaModal)
