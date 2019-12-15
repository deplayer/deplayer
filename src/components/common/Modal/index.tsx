import React from 'react'
import ReactModal from 'react-modal'

import Button from '../Button'

const customStyles = {
  content: {
    zIndex: 10
  },
  overlay: {
    zIndex: 10
  }
}

type Props = {
  children: React.ReactNode
}

const Modal = (props: Props) => {
  const [modalIsOpen,setIsOpen] = React.useState(true)

  return (
    <ReactModal
      shouldCloseOnOverlayClick
      isOpen={modalIsOpen}
      onRequestClose={() => setIsOpen(false)}
      style={customStyles}
    >
      <Button onClick={() => setIsOpen(false)}>close</Button>
      {props.children}
    </ReactModal>
  )
}

export default Modal
