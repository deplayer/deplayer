import React from 'react'
import { Dispatch } from 'react-redux'
import { connect } from 'react-redux'

import * as types from '../../constants/ActionTypes'
import Modal from '../common/Modal'

type Props = {
  showAddMediaModal: boolean,
  dispatch: Dispatch
}

const AddMediaModal = (props: Props) => {
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
    </Modal>
  )
}

export default connect(
  (state: any) => ({
    showAddMediaModal: state.app.showAddMediaModal
  })
)(AddMediaModal)
