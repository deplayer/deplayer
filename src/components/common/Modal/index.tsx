import React from 'react'
import ReactDOM from 'react-dom'
import Icon from '../Icon'

type Props = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
}

const Modal = ({ isOpen, onClose, children, title, className }: Props) => {
  if (!isOpen) return null

  const modalRoot = document.getElementById('modal-root') || document.body

  return ReactDOM.createPortal(
    <div className="modal modal-open">
      <div className={`modal-box relative ${className || ''}`}>
        <button
          className="btn btn-sm btn-circle absolute right-2 top-2"
          onClick={onClose}
          aria-label="Close"
        >
          <Icon icon="faTimes" />
        </button>
        {title && <h3 className="text-lg pr-8">{title}</h3>}
        {children}
      </div>
      <div
          className="modal-backdrop"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && onClose) onClose() }}
          onClick={onClose}
        ></div>
    </div>,
    modalRoot
  )
}

export default Modal
