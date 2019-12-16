import React from 'react'
import ReactModal from 'react-modal'

import Button from '../Button'

ReactModal.setAppElement('#modal')

const customStyles = {
  content: {
    zIndex: 10,
    top: '40px',
    bottom: '40px',
    left: '40px',
    right: '40px'
  },
  overlay: {
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    top: '0px',
    bottom: '0px',
    left: '0px',
    right: '0px'
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
      className='absolute overflow-auto bg-gray-900 p-4 rounded-sm'
      overlayClassName='fixed'
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
