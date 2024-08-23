import React from 'react'
import ReactModal from 'react-modal'

import Button from '../Button'
import Icon from '../Icon'

const customStyles = {
  content: {
    zIndex: 51,
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    maxHeight: '70vh',
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
  title?: string,
  onClose?: () => void
}

// ReactModal.setAppElement('#modal');

const Modal = (props: Props) => {
  const [modalIsOpen, setIsOpen] = React.useState(true)

  const close = () => {
    props.onClose && props.onClose()
    setIsOpen(false)
  }

  return (
    <ReactModal
      shouldCloseOnOverlayClick
      isOpen={modalIsOpen}
      className='absolute bg-gray-200 dark:bg-gray-900 rounded-sm max-w-md mx-auto flex flex-col'
      overlayClassName='fixed'
      onRequestClose={() => close()}
      style={customStyles}
    >
      <div className='w-full flex justify-between p-4'>
        {props.title && <h2 className='py-4 text-2xl'>{props.title}</h2>}
        <Button
          transparent
          onClick={() => close()}
        >
          <Icon icon='faTimes' />
        </Button>
      </div>
      <div className='overflow-auto h-full p-4'>
        {props.children}
      </div>
    </ReactModal>
  )
}

export default Modal
