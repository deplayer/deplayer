import React from 'react'
import ReactModal from 'react-modal'

import Button from '../Button'

ReactModal.setAppElement('#modal')

const customStyles = {
  content: {
    zIndex: 10
  },
  overlay: {
    zIndex: 10
  }
}

type Props = {
  children: React.ReactNode,
  onClose?: () => void
}

const Modal = (props: Props) => {
  const [modalIsOpen, setIsOpen] = React.useState(true)

  const close = () => {
    setIsOpen(false)
    props.onClose && props.onClose()
  }

  return (
    <ReactModal
      shouldCloseOnOverlayClick
      isOpen={modalIsOpen}
      onRequestClose={() => close()}
      style={customStyles}
    >
        <Button
          onClick={() => close()}
        >
          <i className='fa fa-remove' />
        </Button>
      {props.children}
    </ReactModal>
  )
}

export default Modal
