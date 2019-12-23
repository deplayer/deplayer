import React from 'react'
import ReactModal from 'react-modal'

import Button from '../Button'

ReactModal.setAppElement('#modal')

const customStyles = {
  content: {
    zIndex: 51,
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)'
  },
  overlay: {
    zIndex: 100,
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
      className='absolute overflow-auto bg-gray-900 p-4 rounded-sm max-w-md mx-auto'
      overlayClassName='fixed'
      onRequestClose={() => close()}
      style={customStyles}
    >
      <div className='w-full flex justify-end'>
        <Button
          transparent
          onClick={() => close()}
        >
          <i className='fa fa-remove' />
        </Button>
      </div>
      {props.children}
    </ReactModal>
  )
}

export default Modal
